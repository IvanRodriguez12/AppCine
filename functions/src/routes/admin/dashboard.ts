/**
 * routes/admin/dashboard.ts
 * Rutas del dashboard de administración
 */

import { Router } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../middleware/auth';
import { asyncHandler, ApiError } from '../../middleware/errorHandler';
import {
  obtenerDashboardMetrics,
  obtenerVentasPorPeriodo,
  obtenerProductosBajoStock,
  obtenerTopProductosVendidos
} from '../../services/metricsService';

const router = Router();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(verifyToken);
router.use(requireAdmin);

/**
 * GET /admin/dashboard
 * Obtiene todas las métricas principales del dashboard
 */
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const metrics = await obtenerDashboardMetrics();

  res.json({
    message: 'Métricas del dashboard',
    data: metrics,
    generatedAt: new Date().toISOString()
  });
}));

/**
 * GET /admin/dashboard/ventas
 * Obtiene métricas de ventas por período personalizado
 * Query params: fechaInicio, fechaFin (formato ISO 8601)
 */
router.get('/ventas', asyncHandler(async (req: AuthRequest, res: any) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    throw new ApiError(400, 'Debe proporcionar fechaInicio y fechaFin');
  }

  const inicio = new Date(fechaInicio as string);
  const fin = new Date(fechaFin as string);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    throw new ApiError(400, 'Formato de fecha inválido. Use ISO 8601 (YYYY-MM-DD)');
  }

  if (inicio > fin) {
    throw new ApiError(400, 'La fecha de inicio debe ser anterior a la fecha de fin');
  }

  const ventasData = await obtenerVentasPorPeriodo(inicio, fin);

  res.json({
    message: 'Ventas por período',
    periodo: {
      inicio: inicio.toISOString(),
      fin: fin.toISOString()
    },
    data: ventasData
  });
}));

/**
 * GET /admin/dashboard/productos/bajo-stock
 * Obtiene productos con bajo stock
 * Query param: umbral (default: 10)
 */
router.get('/productos/bajo-stock', asyncHandler(async (req: AuthRequest, res: any) => {
  const umbral = req.query.umbral ? Number(req.query.umbral) : 10;

  if (isNaN(umbral) || umbral < 0) {
    throw new ApiError(400, 'El umbral debe ser un número >= 0');
  }

  const productos = await obtenerProductosBajoStock(umbral);

  res.json({
    message: 'Productos con bajo stock',
    umbral,
    count: productos.length,
    productos
  });
}));

/**
 * GET /admin/dashboard/productos/top-vendidos
 * Obtiene los productos más vendidos
 * Query param: limit (default: 10)
 */
router.get('/productos/top-vendidos', asyncHandler(async (req: AuthRequest, res: any) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, 'El límite debe ser un número entre 1 y 100');
  }

  const topProductos = await obtenerTopProductosVendidos(limit);

  res.json({
    message: 'Top productos más vendidos',
    limit,
    productos: topProductos
  });
}));

/**
 * GET /admin/dashboard/resumen-rapido
 * Resumen ejecutivo rápido (para widgets en el frontend)
 */
router.get('/resumen-rapido', asyncHandler(async (req: AuthRequest, res: any) => {
  const metrics = await obtenerDashboardMetrics();

  const resumen = {
    ventasHoy: metrics.ventas.totalHoy,
    ventasMes: metrics.ventas.totalMes,
    ordenesPendientes: metrics.ordenes.pendientes,
    productosActivos: metrics.productos.productosActivos,
    productosSinStock: metrics.productos.productosSinStock,
    nuevosUsuariosHoy: metrics.usuarios.nuevosHoy,
    crecimientoMes: metrics.periodos.comparacionMesAnterior.diferenciaPorcentaje
  };

  res.json({
    message: 'Resumen ejecutivo',
    data: resumen,
    generatedAt: new Date().toISOString()
  });
}));

export default router;