import { Router } from 'express';
import * as admin from 'firebase-admin';
import { db, auth } from '../config/firebase';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/users/register
 * Registro de nuevo usuario
 */
router.post('/register', asyncHandler(async (req: any, res: any) => {
  const { email, password, displayName } = req.body;

  // Validación básica
  if (!email || !password || !displayName) {
    throw new ApiError(400, 'Email, contraseña y nombre son requeridos');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres');
  }

  // Crear usuario en Firebase Auth
  const userRecord = await auth.createUser({
    email,
    password,
    displayName
  });

  // Crear documento en Firestore
  await db.collection('users').doc(userRecord.uid).set({
    email,
    displayName,
    role: 'user',
    favorites: [],
    watchlist: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Generar custom token para login automático
  const customToken = await auth.createCustomToken(userRecord.uid);

  res.status(201).json({
    message: 'Usuario creado exitosamente',
    user: {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName
    },
    customToken
  });
}));

/**
 * GET /api/users/:id
 * Obtener perfil de usuario
 */
router.get('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  // Solo puede ver su propio perfil (a menos que sea admin)
  if (req.user?.uid !== id && req.user?.role !== 'admin') {
    throw new ApiError(403, 'No autorizado para ver este perfil');
  }

  const userDoc = await db.collection('users').doc(id).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data();

  res.json({
    uid: userDoc.id,
    ...userData,
    // No enviar datos sensibles
    password: undefined
  });
}));

/**
 * PUT /api/users/:id
 * Actualizar perfil de usuario
 */
router.put('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { displayName, photoURL, bio } = req.body;

  // Solo puede actualizar su propio perfil
  if (req.user?.uid !== id) {
    throw new ApiError(403, 'No autorizado para actualizar este perfil');
  }

  const updateData: any = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (displayName) updateData.displayName = displayName;
  if (photoURL) updateData.photoURL = photoURL;
  if (bio) updateData.bio = bio;

  await db.collection('users').doc(id).update(updateData);

  // También actualizar en Firebase Auth si es displayName o photoURL
  if (displayName || photoURL) {
    const authUpdate: any = {};
    if (displayName) authUpdate.displayName = displayName;
    if (photoURL) authUpdate.photoURL = photoURL;
    
    await auth.updateUser(id, authUpdate);
  }

  res.json({
    message: 'Perfil actualizado exitosamente',
    data: updateData
  });
}));

/**
 * GET /api/users/:id/favorites
 * Obtener películas favoritas del usuario
 */
router.get('/:id/favorites', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  if (req.user?.uid !== id && req.user?.role !== 'admin') {
    throw new ApiError(403, 'No autorizado');
  }

  const userDoc = await db.collection('users').doc(id).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const favorites = userDoc.data()?.favorites || [];

  res.json({
    userId: id,
    favorites,
    count: favorites.length
  });
}));

/**
 * POST /api/users/:id/favorites
 * Agregar película a favoritos
 */
router.post('/:id/favorites', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { movieId } = req.body;

  if (!movieId) {
    throw new ApiError(400, 'movieId es requerido');
  }

  if (req.user?.uid !== id) {
    throw new ApiError(403, 'No autorizado');
  }

  await db.collection('users').doc(id).update({
    favorites: admin.firestore.FieldValue.arrayUnion(movieId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.json({
    message: 'Película agregada a favoritos',
    movieId
  });
}));

/**
 * DELETE /api/users/:id/favorites/:movieId
 * Quitar película de favoritos
 */
router.delete('/:id/favorites/:movieId', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id, movieId } = req.params;

  if (req.user?.uid !== id) {
    throw new ApiError(403, 'No autorizado');
  }

  await db.collection('users').doc(id).update({
    favorites: admin.firestore.FieldValue.arrayRemove(Number(movieId)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.json({
    message: 'Película quitada de favoritos',
    movieId
  });
}));

export default router;