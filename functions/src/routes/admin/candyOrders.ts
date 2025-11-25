/**
 * routes/admin/candyOrders.ts
 * Rutas de administración para órdenes de Candy Shop
 */

import { Router } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../middleware/auth';
import { asyncHandler, ApiError } from '../../middleware/errorHandler';
import {
  obtenerTodasLasOrdenes,
  cambiarEstadoCanje,
  cambiarEstadoPago,
  cancelarOrden,
  obtenerEstadisticasOrdenes,
  buscarPorCodigoCanje,
  obtenerDetalleOrdenCompleto,
  FiltrosOrdenesAdmin
} from '../../services/adminCandyOrders';

const router = Router();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(verifyToken);
router.use(requireAdmin);

/**
 * GET /admin/candy-orders
 * Listar todas las órdenes con filtros avanzados
 */
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const {
    paymentStatus,
    redeemStatus,
    userId,
    fechaInicio,
    fechaFin,
    limit,
    startAfter
  } = req.query;

  const filtros: FiltrosOrdenesAdmin = {};

  if (paymentStatus) {
    if (!['PENDIENTE', 'PAGADO', 'CANCELADO'].includes(paymentStatus as string)) {
      throw new ApiError(400, 'paymentStatus inválido. Valores: PENDIENTE, PAGADO, CANCELADO');
    }
    filtros.paymentStatus = paymentStatus as any;
  }

  if (redeemStatus) {
    if (!['PENDIENTE', 'CANJEADO'].includes(redeemStatus as string)) {
      throw new ApiError(400, 'redeemStatus inválido. Valores: PENDIENTE, CANJEADO');
    }
    filtros.redeemStatus = redeemStatus as any;
  }

  if (userId) {
    filtros.userId = userId as string;
  }

  if (fechaInicio) {
    filtros.fechaInicio = new Date(fechaInicio as string);
    if (isNaN(filtros.fechaInicio.getTime())) {
      throw new ApiError(400, 'fechaInicio inválida. Use formato ISO 8601 (YYYY-MM-DD)');
    }
  }

  if (fechaFin) {
    filtros.fechaFin = new Date(fechaFin as string);
    if (isNaN(filtros.fechaFin.getTime())) {
      throw new ApiError(400, 'fechaFin inválida. Use formato ISO 8601 (YYYY-MM-DD)');
    }
  }

  if (limit) {
    filtros.limit = Number(limit);
    if (isNaN(filtros.limit) || filtros.limit < 1 || filtros.limit > 100) {
      throw new ApiError(400, 'limit debe estar entre 1 y 100');
    }
  }

  if (startAfter) {
    filtros.startAfter = startAfter as string;
  }

  const resultado = await obtenerTodasLasOrdenes(filtros);

  res.json({
    message: 'Órdenes obtenidas exitosamente',
    filtros: req.query,
    ...resultado
  });
}));

/**
 * GET /admin/candy-orders/stats
 * Estadísticas generales de órdenes
 */
router.get('/stats', asyncHandler(async (req: AuthRequest, res: any) => {
  const stats = await obtenerEstadisticasOrdenes();

  res.json({
    message: 'Estadísticas de órdenes',
    data: stats
  });
}));

/**
 * GET /admin/candy-orders/search/:codigo
 * Buscar orden por código de canje
 */
router.get('/search/:codigo', asyncHandler(async (req: AuthRequest, res: any) => {
  const { codigo } = req.params;

  if (!codigo || codigo.length < 6) {
    throw new ApiError(400, 'Código de canje inválido (mínimo 6 caracteres)');
  }

  const orden = await buscarPorCodigoCanje(codigo);

  if (!orden) {
    throw new ApiError(404, 'Orden no encontrada con ese código');
  }

  res.json({
    message: 'Orden encontrada',
    orden
  });
}));

/**
 * GET /admin/candy-orders/:id
 * Ver detalles completos de una orden
 */
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const detalleCompleto = await obtenerDetalleOrdenCompleto(id);

  res.json({
    message: 'Detalle de orden',
    orden: detalleCompleto
  });
}));

/**
 * PUT /admin/candy-orders/:id/redeem-status
 * Cambiar estado de canje (PENDIENTE <-> CANJEADO)
 */
router.put('/:id/redeem-status', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { redeemStatus } = req.body;

  if (!['PENDIENTE', 'CANJEADO'].includes(redeemStatus)) {
    throw new ApiError(400, 'redeemStatus debe ser PENDIENTE o CANJEADO');
  }

  await cambiarEstadoCanje(id, redeemStatus);

  console.log(`✅ Estado de canje actualizado por admin ${req.user?.uid}: ${id} → ${redeemStatus}`);

  res.json({
    message: 'Estado de canje actualizado exitosamente',
    ordenId: id,
    nuevoEstado: redeemStatus
  });
}));

/**
 * PUT /admin/candy-orders/:id/payment-status
 * Cambiar estado de pago
 */
router.put('/:id/payment-status', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  if (!['PENDIENTE', 'PAGADO', 'CANCELADO'].includes(paymentStatus)) {
    throw new ApiError(400, 'paymentStatus debe ser PENDIENTE, PAGADO o CANCELADO');
  }

  await cambiarEstadoPago(id, paymentStatus);

  console.log(`✅ Estado de pago actualizado por admin ${req.user?.uid}: ${id} → ${paymentStatus}`);

  res.json({
    message: 'Estado de pago actualizado exitosamente',
    ordenId: id,
    nuevoEstado: paymentStatus
  });
}));

/**
 * POST /admin/candy-orders/:id/cancel
 * Cancelar una orden y restaurar stock
 */
router.post('/:id/cancel', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { razon } = req.body;

  await cancelarOrden(id, razon);

  console.log(`🚫 Orden cancelada por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: 'Orden cancelada exitosamente y stock restaurado',
    ordenId: id,
    razon: razon || 'Cancelada por administrador'
  });
}));

/**
 * POST /admin/candy-orders/:id/force-redeem
 * Forzar el canje de una orden (útil para casos especiales)
 */
router.post('/:id/force-redeem', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  await cambiarEstadoCanje(id, 'CANJEADO');

  console.log(`⚠️  Canje forzado por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: 'Orden canjeada forzadamente',
    ordenId: id,
    warning: 'Esta acción fue realizada manualmente por un administrador'
  });
}));

export default router;