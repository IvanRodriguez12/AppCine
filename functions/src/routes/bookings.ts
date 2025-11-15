import { Router } from 'express';
import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/bookings
 * Crear una nueva reserva
 */
router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { showtimeId, seats, totalPrice } = req.body;

  if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0) {
    throw new ApiError(400, 'showtimeId y seats son requeridos');
  }

  if (!totalPrice || totalPrice <= 0) {
    throw new ApiError(400, 'totalPrice debe ser mayor a 0');
  }

  // Verificar que el showtime existe
  const showtimeDoc = await db.collection('showtimes').doc(showtimeId).get();
  if (!showtimeDoc.exists) {
    throw new ApiError(404, 'Función no encontrada');
  }

  const showtimeData = showtimeDoc.data();

  // Verificar que los asientos estén disponibles
  const occupiedSeats = showtimeData?.occupiedSeats || [];
  const requestedSeats = seats.map(s => s.id);
  const conflictingSeats = requestedSeats.filter(seat => occupiedSeats.includes(seat));

  if (conflictingSeats.length > 0) {
    throw new ApiError(400, `Los siguientes asientos ya están ocupados: ${conflictingSeats.join(', ')}`);
  }

  // Crear la reserva
  const bookingRef = await db.collection('bookings').add({
    userId: req.user!.uid,
    showtimeId,
    movieId: showtimeData?.movieId,
    cinemaId: showtimeData?.cinemaId,
    seats: requestedSeats,
    totalPrice,
    status: 'pending', // pending, confirmed, cancelled
    paymentStatus: 'pending', // pending, paid, refunded
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Actualizar asientos ocupados en el showtime
  await db.collection('showtimes').doc(showtimeId).update({
    occupiedSeats: admin.firestore.FieldValue.arrayUnion(...requestedSeats),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.status(201).json({
    message: 'Reserva creada exitosamente',
    bookingId: bookingRef.id,
    status: 'pending',
    seats: requestedSeats
  });
}));

/**
 * GET /api/bookings/:id
 * Obtener detalle de una reserva
 */
router.get('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const bookingDoc = await db.collection('bookings').doc(id).get();

  if (!bookingDoc.exists) {
    throw new ApiError(404, 'Reserva no encontrada');
  }

  const bookingData = bookingDoc.data();

  // Verificar que el usuario sea el dueño de la reserva
  if (bookingData?.userId !== req.user!.uid && req.user?.role !== 'admin') {
    throw new ApiError(403, 'No autorizado para ver esta reserva');
  }

  // Obtener información adicional
  const [showtimeDoc, movieDoc, cinemaDoc] = await Promise.all([
    db.collection('showtimes').doc(bookingData!.showtimeId).get(),
    db.collection('movies').doc(String(bookingData!.movieId)).get(),
    db.collection('cinemas').doc(bookingData!.cinemaId).get()
  ]);

  res.json({
    id: bookingDoc.id,
    ...bookingData,
    showtime: showtimeDoc.exists ? showtimeDoc.data() : null,
    movie: movieDoc.exists ? movieDoc.data() : null,
    cinema: cinemaDoc.exists ? cinemaDoc.data() : null
  });
}));

/**
 * GET /api/bookings/user/:userId
 * Obtener todas las reservas de un usuario
 */
router.get('/user/:userId', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { userId } = req.params;

  // Solo puede ver sus propias reservas
  if (req.user!.uid !== userId && req.user?.role !== 'admin') {
    throw new ApiError(403, 'No autorizado');
  }

  const bookingsSnapshot = await db.collection('bookings')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  const bookings = await Promise.all(
    bookingsSnapshot.docs.map(async (doc) => {
      const bookingData = doc.data();
      
      // Obtener info de la película
      const movieDoc = await db.collection('movies')
        .doc(String(bookingData.movieId))
        .get();

      return {
        id: doc.id,
        ...bookingData,
        movie: movieDoc.exists ? {
          id: movieDoc.id,
          title: movieDoc.data()?.title,
          posterPath: movieDoc.data()?.posterPath
        } : null
      };
    })
  );

  res.json({
    userId,
    bookings,
    count: bookings.length
  });
}));

/**
 * PUT /api/bookings/:id/cancel
 * Cancelar una reserva
 */
router.put('/:id/cancel', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const bookingDoc = await db.collection('bookings').doc(id).get();

  if (!bookingDoc.exists) {
    throw new ApiError(404, 'Reserva no encontrada');
  }

  const bookingData = bookingDoc.data();

  // Verificar que el usuario sea el dueño
  if (bookingData?.userId !== req.user!.uid) {
    throw new ApiError(403, 'No autorizado');
  }

  // No se puede cancelar si ya está cancelada
  if (bookingData?.status === 'cancelled') {
    throw new ApiError(400, 'Esta reserva ya está cancelada');
  }

  // Liberar los asientos
  await db.collection('showtimes').doc(bookingData!.showtimeId).update({
    occupiedSeats: admin.firestore.FieldValue.arrayRemove(...bookingData!.seats),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Actualizar estado de la reserva
  await db.collection('bookings').doc(id).update({
    status: 'cancelled',
    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.json({
    message: 'Reserva cancelada exitosamente',
    bookingId: id
  });
}));

/**
 * GET /api/bookings/:id/ticket
 * Generar ticket/QR para una reserva
 */
router.get('/:id/ticket', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const bookingDoc = await db.collection('bookings').doc(id).get();

  if (!bookingDoc.exists) {
    throw new ApiError(404, 'Reserva no encontrada');
  }

  const bookingData = bookingDoc.data();

  if (bookingData?.userId !== req.user!.uid && req.user?.role !== 'admin') {
    throw new ApiError(403, 'No autorizado');
  }

  if (bookingData?.status !== 'confirmed') {
    throw new ApiError(400, 'La reserva debe estar confirmada para generar el ticket');
  }

  // Aquí podrías generar un QR code real
  // Por ahora devolvemos un token simple
  const ticketToken = Buffer.from(JSON.stringify({
    bookingId: id,
    userId: bookingData.userId,
    timestamp: Date.now()
  })).toString('base64');

  res.json({
    bookingId: id,
    ticketToken,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(ticketToken)}&size=300x300`,
    seats: bookingData.seats,
    showtime: bookingData.showtimeId
  });
}));

export default router;