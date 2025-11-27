import { Router } from 'express';
import * as admin from 'firebase-admin';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/errorHandler';
import { getOccupiedSeatsByShowtime, getShowtimesByMovie } from '../services/firestoreTickets';


const router = Router();

/**
 * GET /showtimes/by-movie/:movieId?fecha=YYYY-MM-DD
 * Lista todas las funciones (showtimes) de una película,
 * opcionalmente filtradas por fecha.
 */
router.get(
  '/by-movie/:movieId',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { movieId } = req.params;
    const { fecha } = req.query;

    if (!movieId) {
      throw new ApiError(400, 'movieId es requerido');
    }

    const movieIdNum = Number(movieId);
    if (isNaN(movieIdNum)) {
      throw new ApiError(400, 'movieId debe ser numérico');
    }

    const showtimes = await getShowtimesByMovie(
      movieIdNum,
      typeof fecha === 'string' ? fecha : undefined
    );

    return res.json({
      movieId: movieIdNum,
      fecha: fecha ?? null,
      count: showtimes.length,
      showtimes,
    });
  })
);

/**
 * GET /showtimes/:id
 * Obtiene una función específica con información de asientos.
 */
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, 'id de showtime es requerido');
    }

    const doc = await admin.firestore().collection('showtimes').doc(id).get();

    if (!doc.exists) {
      throw new ApiError(404, 'Función no encontrada');
    }

    const data = doc.data() || {};

    // Normalizar campos de asientos
    const occupiedSeats =
      (data as any).occupiedSeats || (data as any).asientosOcupados || [];
    const totalSeats = (data as any).totalSeats || null;

    return res.json({
      id: doc.id,
      ...data,
      occupiedSeats,
      totalSeats,
    });
  })
);

router.get('/:id/occupied-seats', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Falta el ID del showtime' });
    }

    const occupiedSeats = await getOccupiedSeatsByShowtime(id);

    return res.json({
      message: 'Asientos ocupados obtenidos correctamente',
      data: {
        showtimeId: id,
        occupiedSeats,
      },
    });
  } catch (error) {
    console.error('Error al obtener asientos ocupados:', error);
    return res.status(500).json({
      message: 'Error al obtener asientos ocupados',
      error: (error as Error).message,
    });
  }
});

export default router;