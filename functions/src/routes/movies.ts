import { Router } from 'express';
import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/movies
 * Listar películas con paginación
 */
router.get('/', optionalAuth, asyncHandler(async (req: AuthRequest, res: any) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const genre = req.query.genre as string;

  let query = db.collection('movies')
    .orderBy('createdAt', 'desc')
    .limit(limit);

  // Filtrar por género si se proporciona
  if (genre) {
    query = db.collection('movies')
      .where('genres', 'array-contains', genre)
      .orderBy('createdAt', 'desc')
      .limit(limit) as any;
  }

  // Paginación simple (en producción usar cursors)
  if (page > 1) {
    const skip = (page - 1) * limit;
    const snapshot = await db.collection('movies')
      .orderBy('createdAt', 'desc')
      .limit(skip)
      .get();
    
    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      query = query.startAfter(lastDoc) as any;
    }
  }

  const snapshot = await query.get();

  const movies = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  res.json({
    movies,
    page,
    limit,
    count: movies.length
  });
}));

/**
 * GET /api/movies/:id
 * Obtener detalle de una película
 */
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const movieDoc = await db.collection('movies').doc(id).get();

  if (!movieDoc.exists) {
    throw new ApiError(404, 'Película no encontrada');
  }

  const movieData = movieDoc.data();

  // Si el usuario está autenticado, agregar si está en favoritos
  let isFavorite = false;
  if (req.user) {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const favorites = userDoc.data()?.favorites || [];
    isFavorite = favorites.includes(Number(id));
  }

  res.json({
    id: movieDoc.id,
    ...movieData,
    isFavorite
  });
}));

/**
 * GET /api/movies/:id/reviews
 * Obtener reseñas de una película
 */
router.get('/:id/reviews', asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  const reviewsSnapshot = await db.collection('reviews')
    .where('movieId', '==', Number(id))
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  const reviews = await Promise.all(
    reviewsSnapshot.docs.map(async (doc) => {
      const reviewData = doc.data();
      
      // Obtener información del usuario que hizo la reseña
      const userDoc = await db.collection('users').doc(reviewData.userId).get();
      const userData = userDoc.data();

      return {
        id: doc.id,
        ...reviewData,
        user: {
          uid: reviewData.userId,
          displayName: userData?.displayName || 'Usuario',
          photoURL: userData?.photoURL || null
        }
      };
    })
  );

  res.json({
    movieId: id,
    reviews,
    count: reviews.length
  });
}));

/**
 * POST /api/movies/:id/reviews
 * Crear una reseña para una película
 */
router.post('/:id/reviews', optionalAuth, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!req.user) {
    throw new ApiError(401, 'Debes estar autenticado para crear una reseña');
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, 'El rating debe estar entre 1 y 5');
  }

  if (!comment || comment.trim().length < 10) {
    throw new ApiError(400, 'El comentario debe tener al menos 10 caracteres');
  }

  // Verificar que la película existe
  const movieDoc = await db.collection('movies').doc(id).get();
  if (!movieDoc.exists) {
    throw new ApiError(404, 'Película no encontrada');
  }

  // Verificar que el usuario no haya hecho una reseña antes
  const existingReview = await db.collection('reviews')
    .where('movieId', '==', Number(id))
    .where('userId', '==', req.user.uid)
    .get();

  if (!existingReview.empty) {
    throw new ApiError(400, 'Ya has hecho una reseña de esta película');
  }

  // Crear la reseña
  const reviewRef = await db.collection('reviews').add({
    movieId: Number(id),
    userId: req.user.uid,
    rating,
    comment: comment.trim(),
    likes: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Actualizar rating promedio de la película (simplificado)
  const allReviews = await db.collection('reviews')
    .where('movieId', '==', Number(id))
    .get();

  const totalRating = allReviews.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
  const avgRating = totalRating / allReviews.size;

  await db.collection('movies').doc(id).update({
    averageRating: avgRating,
    reviewCount: allReviews.size,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.status(201).json({
    message: 'Reseña creada exitosamente',
    reviewId: reviewRef.id,
    rating,
    comment
  });
}));

/**
 * GET /api/movies/trending
 * Obtener películas en tendencia
 */
router.get('/trending/now', asyncHandler(async (req: any, res: any) => {
  const limit = parseInt(req.query.limit as string) || 10;

  // Aquí podrías implementar lógica más compleja
  // Por ahora, ordenamos por rating y fecha
  const snapshot = await db.collection('movies')
    .where('averageRating', '>=', 4)
    .orderBy('averageRating', 'desc')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  const movies = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  res.json({
    trending: movies,
    count: movies.length
  });
}));

export default router;