/**
 * routes/admin/tickets.ts
 * Rutas de administración para gestión de tickets
 */

import { Router } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../middleware/auth';
import { asyncHandler, ApiError } from '../../middleware/errorHandler';
import { db } from '../../config/firebase';
import { Ticket } from '../../models/ticket';

const router = Router();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(verifyToken);
router.use(requireAdmin);

/**
 * Interfaz para filtros de listado
 */
interface FiltrosTickets {
  userId?: string;
  showtimeId?: string;
  estado?: 'confirmado' | 'pendiente' | 'cancelado';
  metodoPago?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  limit?: number;
  startAfter?: string;
}

/**
 * Interfaz para estadísticas
 */
interface EstadisticasTickets {
  total: number;
  confirmados: number;
  pendientes: number;
  cancelados: number;
  porMetodoPago: Record<string, number>;
  asientosTotales: number;
  ingresosTotales: number;
  ingresosPorMetodo: Record<string, number>;
  ticketPromedio: number;
}

/**
 * GET /admin/tickets
 * Listar todos los tickets con filtros
 */
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const {
    userId,
    showtimeId,
    estado,
    metodoPago,
    fechaInicio,
    fechaFin,
    limit,
    startAfter
  } = req.query;

  const filtros: FiltrosTickets = {};
  let query: any = db.collection('tickets');

  // Aplicar filtros
  if (userId) {
    filtros.userId = userId as string;
    query = query.where('userId', '==', userId);
  }

  if (showtimeId) {
    filtros.showtimeId = showtimeId as string;
    query = query.where('showtimeId', '==', showtimeId);
  }

  if (estado && ['confirmado', 'pendiente', 'cancelado'].includes(estado as string)) {
    filtros.estado = estado as any;
    query = query.where('estado', '==', estado);
  }

  if (metodoPago) {
    filtros.metodoPago = metodoPago as string;
    query = query.where('metodoPago', '==', metodoPago);
  }

  if (fechaInicio) {
    filtros.fechaInicio = new Date(fechaInicio as string);
    if (isNaN(filtros.fechaInicio.getTime())) {
      throw new ApiError(400, 'fechaInicio inválida. Use formato ISO 8601 (YYYY-MM-DD)');
    }
    query = query.where('createdAt', '>=', filtros.fechaInicio);
  }

  if (fechaFin) {
    filtros.fechaFin = new Date(fechaFin as string);
    if (isNaN(filtros.fechaFin.getTime())) {
      throw new ApiError(400, 'fechaFin inválida. Use formato ISO 8601 (YYYY-MM-DD)');
    }
    query = query.where('createdAt', '<=', filtros.fechaFin);
  }

  // Ordenar por fecha de creación (más recientes primero)
  query = query.orderBy('createdAt', 'desc');

  // Paginación
  const pageLimit = limit ? Math.min(Number(limit), 100) : 50;
  filtros.limit = pageLimit;
  query = query.limit(pageLimit);

  if (startAfter) {
    filtros.startAfter = startAfter as string;
    const lastDoc = await db.collection('tickets').doc(startAfter as string).get();
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc);
    }
  }

  const snapshot = await query.get();

  const tickets: Ticket[] = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data()
  } as Ticket));

  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  res.json({
    message: 'Tickets obtenidos exitosamente',
    filtros: filtros,
    data: tickets,
    pagination: {
      count: tickets.length,
      hasMore: tickets.length === pageLimit,
      lastDocId: lastVisible ? lastVisible.id : null
    }
  });
}));

/**
 * GET /admin/tickets/stats
 * Estadísticas generales de tickets
 */
router.get('/stats', asyncHandler(async (req: AuthRequest, res: any) => {
  const snapshot = await db.collection('tickets').get();

  const stats: EstadisticasTickets = {
    total: 0,
    confirmados: 0,
    pendientes: 0,
    cancelados: 0,
    porMetodoPago: {},
    asientosTotales: 0,
    ingresosTotales: 0,
    ingresosPorMetodo: {},
    ticketPromedio: 0
  };

  snapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const ticket = doc.data() as Ticket;
    stats.total++;

    // Por estado
    if (ticket.estado === 'confirmado') {
      stats.confirmados++;
    } else if (ticket.estado === 'pendiente') {
      stats.pendientes++;
    } else if (ticket.estado === 'cancelado') {
      stats.cancelados++;
    }

    // Por método de pago
    const metodo = ticket.metodoPago || 'desconocido';
    stats.porMetodoPago[metodo] = (stats.porMetodoPago[metodo] || 0) + 1;

    // Asientos
    const cantidadAsientos = ticket.asientos?.length || 0;
    stats.asientosTotales += cantidadAsientos;

    // Ingresos (solo tickets confirmados)
    if (ticket.estado === 'confirmado') {
      const total = ticket.total || 0;
      stats.ingresosTotales += total;
      stats.ingresosPorMetodo[metodo] = (stats.ingresosPorMetodo[metodo] || 0) + total;
    }
  });

  stats.ticketPromedio = stats.confirmados > 0 
    ? parseFloat((stats.ingresosTotales / stats.confirmados).toFixed(2))
    : 0;

  res.json({
    message: 'Estadísticas de tickets',
    data: stats
  });
}));

/**
 * GET /admin/tickets/search/:query
 * Buscar tickets por ID, userId, o token
 */
router.get('/search/:query', asyncHandler(async (req: AuthRequest, res: any) => {
  const { query: searchQuery } = req.params;

  if (!searchQuery || searchQuery.length < 3) {
    throw new ApiError(400, 'La búsqueda debe tener al menos 3 caracteres');
  }

  // Intentar buscar por ID directamente
  const ticketDoc = await db.collection('tickets').doc(searchQuery).get();
  
  if (ticketDoc.exists) {
    const ticket: Ticket = {
      id: ticketDoc.id,
      ...ticketDoc.data()
    } as Ticket;

    return res.json({
      message: 'Ticket encontrado por ID',
      tickets: [ticket],
      searchType: 'id'
    });
  }

  // Buscar por userId
  const userTicketsSnap = await db
    .collection('tickets')
    .where('userId', '==', searchQuery)
    .limit(50)
    .get();

  if (!userTicketsSnap.empty) {
    const tickets = userTicketsSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data()
    } as Ticket));

    return res.json({
      message: 'Tickets encontrados por userId',
      tickets,
      searchType: 'userId',
      count: tickets.length
    });
  }

  // Buscar por token
  const tokenTicketsSnap = await db
    .collection('tickets')
    .where('token', '==', searchQuery)
    .limit(10)
    .get();

  if (!tokenTicketsSnap.empty) {
    const tickets = tokenTicketsSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data()
    } as Ticket));

    return res.json({
      message: 'Tickets encontrados por token',
      tickets,
      searchType: 'token',
      count: tickets.length
    });
  }

  throw new ApiError(404, 'No se encontraron tickets con ese criterio de búsqueda');
}));

/**
 * GET /admin/tickets/:id
 * Ver detalles completos de un ticket
 */
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const doc = await db.collection('tickets').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Ticket no encontrado');
  }

  const ticket: Ticket = {
    id: doc.id,
    ...doc.data()
  } as Ticket;

  // Obtener información adicional del showtime
  let showtimeInfo = null;
  if (ticket.showtimeId) {
    const showtimeDoc = await db.collection('showtimes').doc(ticket.showtimeId).get();
    if (showtimeDoc.exists) {
      showtimeInfo = {
        id: showtimeDoc.id,
        ...showtimeDoc.data()
      };
    }
  }

  // Obtener información del usuario
  let userInfo = null;
  if (ticket.userId) {
    const userDoc = await db.collection('users').doc(ticket.userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      userInfo = {
        userId: ticket.userId,
        email: userData?.email || null,
        displayName: userData?.displayName || null,
        accountLevel: userData?.accountLevel || null
      };
    }
  }

  res.json({
    message: 'Detalle del ticket',
    ticket,
    showtime: showtimeInfo,
    user: userInfo
  });
}));

/**
 * PUT /admin/tickets/:id/status
 * Cambiar el estado de un ticket
 */
router.put('/:id/status', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!['confirmado', 'pendiente', 'cancelado'].includes(estado)) {
    throw new ApiError(400, 'estado debe ser: confirmado, pendiente o cancelado');
  }

  const doc = await db.collection('tickets').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Ticket no encontrado');
  }

  await db.collection('tickets').doc(id).update({
    estado
  });

  console.log(`✅ Estado de ticket actualizado por admin ${req.user?.uid}: ${id} → ${estado}`);

  res.json({
    message: 'Estado del ticket actualizado exitosamente',
    ticketId: id,
    nuevoEstado: estado
  });
}));

/**
 * POST /admin/tickets/:id/cancel
 * Cancelar un ticket y liberar asientos
 */
router.post('/:id/cancel', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { razon } = req.body;

  const ticketDoc = await db.collection('tickets').doc(id).get();

  if (!ticketDoc.exists) {
    throw new ApiError(404, 'Ticket no encontrado');
  }

  const ticket = ticketDoc.data() as Ticket;

  if (ticket.estado === 'cancelado') {
    throw new ApiError(400, 'El ticket ya está cancelado');
  }

  // Usar transacción para cancelar y liberar asientos
  await db.runTransaction(async (transaction) => {
    const showtimeRef = db.collection('showtimes').doc(ticket.showtimeId);
    const showtimeDoc = await transaction.get(showtimeRef);

    if (showtimeDoc.exists) {
      const showtimeData = showtimeDoc.data()!;
      const ocupados: string[] = showtimeData.occupiedSeats || showtimeData.asientosOcupados || [];

      // Liberar asientos del ticket
      const nuevosOcupados = ocupados.filter((asiento: string) => 
        !ticket.asientos.includes(asiento)
      );

      transaction.update(showtimeRef, {
        occupiedSeats: nuevosOcupados,
        asientosOcupados: nuevosOcupados
      });
    }

    // Actualizar ticket
    transaction.update(ticketDoc.ref, {
      estado: 'cancelado',
      canceladoAt: new Date(),
      canceladoPor: 'admin',
      canceladoRazon: razon || 'Cancelado por administrador'
    });
  });

  console.log(`🚫 Ticket cancelado por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: 'Ticket cancelado exitosamente y asientos liberados',
    ticketId: id,
    asientosLiberados: ticket.asientos,
    razon: razon || 'Cancelado por administrador'
  });
}));

/**
 * PUT /admin/tickets/:id/verify
 * Marcar un ticket como verificado/usado (para control de acceso)
 */
router.put('/:id/verify', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { verified } = req.body;

  const doc = await db.collection('tickets').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Ticket no encontrado');
  }

  const ticket = doc.data() as Ticket;

  if (ticket.estado !== 'confirmado') {
    throw new ApiError(400, 'Solo se pueden verificar tickets confirmados');
  }

  const verifiedValue = verified !== false; // true por defecto

  await db.collection('tickets').doc(id).update({
    verified: verifiedValue,
    verifiedAt: verifiedValue ? new Date() : null,
    verifiedBy: verifiedValue ? req.user?.uid : null
  });

  console.log(`✅ Ticket ${verifiedValue ? 'verificado' : 'desverificado'} por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: `Ticket ${verifiedValue ? 'verificado' : 'desverificado'} exitosamente`,
    ticketId: id,
    verified: verifiedValue
  });
}));

/**
 * POST /admin/tickets/:id/resend-qr
 * Reenviar QR code por email (requiere implementar servicio de email)
 */
router.post('/:id/resend-qr', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const doc = await db.collection('tickets').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Ticket no encontrado');
  }

  const ticket = doc.data() as Ticket;

  if (ticket.estado !== 'confirmado') {
    throw new ApiError(400, 'Solo se puede reenviar QR de tickets confirmados');
  }

  // TODO: Implementar envío de email con QR
  // Por ahora solo registramos la acción

  console.log(`📧 Reenvío de QR solicitado por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: 'Solicitud de reenvío de QR registrada',
    ticketId: id,
    note: 'Funcionalidad de envío de email pendiente de implementar',
    qrCodeUrl: ticket.qrCodeUrl || null
  });
}));

export default router;