/**
 * routes/admin/showtimes.ts
 * Rutas de administración para gestión de funciones (showtimes)
 */

import * as admin from 'firebase-admin';
import { Router } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../middleware/auth';
import { asyncHandler, ApiError } from '../../middleware/errorHandler';
import { db } from '../../config/firebase';
import { Showtime } from '../../models/showtime';


const router = Router();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(verifyToken);
router.use(requireAdmin);

/**
 * Interfaz para filtros de listado
 */
interface FiltrosShowtimes {
  movieId?: number;
  cinemaId?: string;
  salaId?: string;
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
  limit?: number;
  startAfter?: string;
}

/**
 * Interfaz para estadísticas
 */
interface EstadisticasShowtimes {
  total: number;
  porPelicula: Record<number, number>;
  porCine: Record<string, number>;
  porSala: Record<string, number>;
  porFecha: Record<string, number>;
  asientosTotalesVendidos: number;
  ingresosTotales: number;
  promedioOcupacion: number;
}

/**
 * GET /admin/showtimes
 * Listar todas las funciones con filtros
 */
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const {
    movieId,
    cinemaId,
    salaId,
    fecha,
    fechaInicio,
    fechaFin,
    limit,
    startAfter
  } = req.query;

  const filtros: FiltrosShowtimes = {};
  let query: any = db.collection('showtimes');

  // Aplicar filtros
  if (movieId) {
    const movieIdNum = Number(movieId);
    if (isNaN(movieIdNum)) {
      throw new ApiError(400, 'movieId debe ser un número');
    }
    filtros.movieId = movieIdNum;
    query = query.where('movieId', '==', movieIdNum);
  }

  if (cinemaId) {
    filtros.cinemaId = cinemaId as string;
    query = query.where('cinemaId', '==', cinemaId);
  }

  if (salaId) {
    filtros.salaId = salaId as string;
    query = query.where('salaId', '==', salaId);
  }

  if (fecha) {
    filtros.fecha = fecha as string;
    query = query.where('fecha', '==', fecha);
  }

  // Filtros por rango de fechas (requiere índice compuesto)
  if (fechaInicio && !fecha) {
    filtros.fechaInicio = fechaInicio as string;
    query = query.where('fecha', '>=', fechaInicio);
  }

  if (fechaFin && !fecha) {
    filtros.fechaFin = fechaFin as string;
    query = query.where('fecha', '<=', fechaFin);
  }

  // Ordenar por fecha y hora
  query = query.orderBy('fecha', 'desc').orderBy('hora', 'desc');

  // Paginación
  const pageLimit = limit ? Math.min(Number(limit), 100) : 50;
  filtros.limit = pageLimit;
  query = query.limit(pageLimit);

  if (startAfter) {
    filtros.startAfter = startAfter as string;
    const lastDoc = await db.collection('showtimes').doc(startAfter as string).get();
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc);
    }
  }

  const snapshot = await query.get();

  const showtimes: Showtime[] = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = doc.data();
    return {
      id: doc.id,
      movieId: data.movieId,
      cinemaId: data.cinemaId,
      salaId: data.salaId,
      fecha: data.fecha,
      hora: data.hora,
      precioBase: data.precioBase,
      asientosOcupados: data.asientosOcupados || data.occupiedSeats || [],
      createdAt: data.createdAt
    } as Showtime;
  });

  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  res.json({
    message: 'Funciones obtenidas exitosamente',
    filtros: filtros,
    data: showtimes,
    pagination: {
      count: showtimes.length,
      hasMore: showtimes.length === pageLimit,
      lastDocId: lastVisible ? lastVisible.id : null
    }
  });
}));

/**
 * GET /admin/showtimes/stats
 * Estadísticas generales de funciones
 */
router.get('/stats', asyncHandler(async (req: AuthRequest, res: any) => {
  const snapshot = await db.collection('showtimes').get();

  const stats: EstadisticasShowtimes = {
    total: 0,
    porPelicula: {},
    porCine: {},
    porSala: {},
    porFecha: {},
    asientosTotalesVendidos: 0,
    ingresosTotales: 0,
    promedioOcupacion: 0
  };

  let totalAsientosVendidos = 0;

  snapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = doc.data();
    stats.total++;

    // Por película
    const movieId = data.movieId;
    stats.porPelicula[movieId] = (stats.porPelicula[movieId] || 0) + 1;

    // Por cine
    const cinemaId = data.cinemaId;
    stats.porCine[cinemaId] = (stats.porCine[cinemaId] || 0) + 1;

    // Por sala
    const salaId = data.salaId;
    stats.porSala[salaId] = (stats.porSala[salaId] || 0) + 1;

    // Por fecha
    const fecha = data.fecha;
    stats.porFecha[fecha] = (stats.porFecha[fecha] || 0) + 1;

    // Asientos vendidos
    const asientosOcupados = data.asientosOcupados || data.occupiedSeats || [];
    const cantidadVendidos = asientosOcupados.length;
    totalAsientosVendidos += cantidadVendidos;

    // Ingresos
    const precioBase = data.precioBase || 0;
    stats.ingresosTotales += cantidadVendidos * precioBase;
  });

  stats.asientosTotalesVendidos = totalAsientosVendidos;
  stats.promedioOcupacion = stats.total > 0 
    ? parseFloat((totalAsientosVendidos / stats.total).toFixed(2))
    : 0;

  res.json({
    message: 'Estadísticas de funciones',
    data: stats
  });
}));

/**
 * GET /admin/showtimes/:id
 * Ver detalles de una función específica
 */
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const doc = await db.collection('showtimes').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Función no encontrada');
  }

  const data = doc.data()!;
  const showtime: Showtime = {
    id: doc.id,
    movieId: data.movieId,
    cinemaId: data.cinemaId,
    salaId: data.salaId,
    fecha: data.fecha,
    hora: data.hora,
    precioBase: data.precioBase,
    asientosOcupados: data.asientosOcupados || data.occupiedSeats || [],
    createdAt: data.createdAt
  };

  res.json({
    message: 'Detalle de la función',
    showtime
  });
}));

/**
 * GET /admin/showtimes/:id/tickets
 * Ver todos los tickets vendidos para una función
 */
router.get('/:id/tickets', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  // Verificar que la función existe
  const showtimeDoc = await db.collection('showtimes').doc(id).get();
  if (!showtimeDoc.exists) {
    throw new ApiError(404, 'Función no encontrada');
  }

  // Obtener tickets
  const ticketsSnap = await db
    .collection('tickets')
    .where('showtimeId', '==', id)
    .get();

  const tickets = ticketsSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data()
  }));

  const showtimeData = showtimeDoc.data()!;
  const totalVendidos = (showtimeData.asientosOcupados || showtimeData.occupiedSeats || []).length;
  const ingresos = totalVendidos * (showtimeData.precioBase || 0);

  res.json({
    message: 'Tickets de la función',
    showtimeId: id,
    tickets,
    resumen: {
      totalTickets: tickets.length,
      asientosVendidos: totalVendidos,
      ingresosTotales: ingresos
    }
  });
}));

/**
 * POST /admin/showtimes
 * Crear una nueva función
 */
router.post('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const {
    movieId,
    cinemaId,
    salaId,
    fecha,
    hora,
    precioBase
  } = req.body;

  // Validaciones
  if (!movieId || typeof movieId !== 'number') {
    throw new ApiError(400, 'movieId es requerido y debe ser un número');
  }

  if (!cinemaId || typeof cinemaId !== 'string') {
    throw new ApiError(400, 'cinemaId es requerido');
  }

  if (!salaId || typeof salaId !== 'string') {
    throw new ApiError(400, 'salaId es requerido');
  }

  if (!fecha || typeof fecha !== 'string') {
    throw new ApiError(400, 'fecha es requerida (formato: YYYY-MM-DD)');
  }

  if (!hora || typeof hora !== 'string') {
    throw new ApiError(400, 'hora es requerida (formato: HH:MM)');
  }

  if (!precioBase || typeof precioBase !== 'number' || precioBase <= 0) {
    throw new ApiError(400, 'precioBase es requerido y debe ser mayor a 0');
  }

  // Validar formato de fecha
  const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!fechaRegex.test(fecha)) {
    throw new ApiError(400, 'fecha debe estar en formato YYYY-MM-DD');
  }

  // Validar formato de hora
  const horaRegex = /^\d{2}:\d{2}$/;
  if (!horaRegex.test(hora)) {
    throw new ApiError(400, 'hora debe estar en formato HH:MM');
  }

  // Verificar que no exista una función duplicada (misma película, sala, fecha y hora)
  const duplicateCheck = await db
    .collection('showtimes')
    .where('movieId', '==', movieId)
    .where('salaId', '==', salaId)
    .where('fecha', '==', fecha)
    .where('hora', '==', hora)
    .limit(1)
    .get();

  if (!duplicateCheck.empty) {
    throw new ApiError(409, 'Ya existe una función con los mismos datos');
  }

  const newShowtime: Omit<Showtime, 'id'> = {
    movieId,
    cinemaId,
    salaId,
    fecha,
    hora,
    precioBase,
    asientosOcupados: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp() as any
  };

  const docRef = await db.collection('showtimes').add(newShowtime);

  console.log(`✅ Función creada por admin ${req.user?.uid}: ${docRef.id}`);

  res.status(201).json({
    message: 'Función creada exitosamente',
    showtimeId: docRef.id
  });
}));

/**
 * PUT /admin/showtimes/:id
 * Actualizar una función existente
 */
router.put('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const updates = req.body;

  const doc = await db.collection('showtimes').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Función no encontrada');
  }

  // No permitir cambiar asientosOcupados directamente (usar endpoint específico)
  if (updates.asientosOcupados || updates.occupiedSeats) {
    throw new ApiError(400, 'No se puede modificar asientosOcupados directamente. Use el endpoint de tickets.');
  }

  const validUpdates: any = {};
  const allowedFields = ['movieId', 'cinemaId', 'salaId', 'fecha', 'hora', 'precioBase'];

  allowedFields.forEach(field => {
    if (field in updates) {
      validUpdates[field] = updates[field];
    }
  });

  if (Object.keys(validUpdates).length === 0) {
    throw new ApiError(400, 'No hay campos válidos para actualizar');
  }

  // Validaciones
  if (validUpdates.precioBase && (typeof validUpdates.precioBase !== 'number' || validUpdates.precioBase <= 0)) {
    throw new ApiError(400, 'precioBase debe ser un número mayor a 0');
  }

  await db.collection('showtimes').doc(id).update(validUpdates);

  console.log(`✅ Función actualizada por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: 'Función actualizada exitosamente',
    showtimeId: id,
    updates: validUpdates
  });
}));

/**
 * DELETE /admin/showtimes/:id
 * Eliminar una función
 */
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { force } = req.query;

  const doc = await db.collection('showtimes').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Función no encontrada');
  }

  // Verificar si tiene tickets vendidos
  const ticketsSnap = await db
    .collection('tickets')
    .where('showtimeId', '==', id)
    .limit(1)
    .get();

  if (!ticketsSnap.empty && force !== 'true') {
    throw new ApiError(400, 'No se puede eliminar una función con tickets vendidos. Use ?force=true para forzar.');
  }

  await db.collection('showtimes').doc(id).delete();

  console.log(`🗑️  Función eliminada por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: 'Función eliminada exitosamente',
    showtimeId: id,
    warning: ticketsSnap.empty ? null : 'La función tenía tickets vendidos'
  });
}));

/**
 * POST /admin/showtimes/:id/reset-seats
 * Resetear asientos ocupados de una función (útil para pruebas o correcciones)
 */
router.post('/:id/reset-seats', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const doc = await db.collection('showtimes').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Función no encontrada');
  }

  await db.collection('showtimes').doc(id).update({
    occupiedSeats: [],
    asientosOcupados: []
  });

  console.log(`⚠️  Asientos reseteados por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: 'Asientos reseteados exitosamente',
    showtimeId: id,
    warning: 'Los tickets existentes no fueron modificados. Use con precaución.'
  });
}));

export default router;