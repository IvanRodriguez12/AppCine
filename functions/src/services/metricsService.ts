/**
 * services/metricsService.ts
 * Servicio para calcular métricas del dashboard admin
 */

import { db } from '../config/firebase';
import { CandyOrder } from '../models/candyOrder';
import { CandyProduct } from '../models/candyProduct';
import { User } from '../models/user';

export interface DashboardMetrics {
  ventas: VentasMetrics;
  ordenes: OrdenesMetrics;
  productos: ProductosMetrics;
  usuarios: UsuariosMetrics;
  periodos: PeriodosMetrics;
}

export interface VentasMetrics {
  totalHoy: number;
  totalSemana: number;
  totalMes: number;
  totalGeneral: number;
  promedioOrden: number;
  ordenMasAlta: number;
}

export interface OrdenesMetrics {
  totalHoy: number;
  totalSemana: number;
  totalMes: number;
  totalGeneral: number;
  pendientes: number;
  canjeadas: number;
  canceladas: number;
  tasaCanje: number;
}

export interface ProductosMetrics {
  totalProductos: number;
  productosActivos: number;
  productosSinStock: number;
  productoMasVendido: {
    nombre: string;
    cantidadVendida: number;
  } | null;
}

export interface UsuariosMetrics {
  totalUsuarios: number;
  nuevosHoy: number;
  nuevosSemana: number;
  nuevosMes: number;
  conCompras: number;
}

export interface PeriodosMetrics {
  ultimosDias: Array<{
    fecha: string;
    ventas: number;
    ordenes: number;
  }>;
  comparacionMesAnterior: {
    ventasActual: number;
    ventasAnterior: number;
    diferenciaPorcentaje: number;
  };
}

/**
 * Convierte Timestamp de Firestore a Date
 */
const toDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

/**
 * Obtiene todas las métricas del dashboard
 */
export const obtenerDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // === OBTENER ÓRDENES ===
  const ordenesSnapshot = await db.collection('candyOrders').get();
  const ordenes = ordenesSnapshot.docs.map(doc => {
    const data = doc.data() as CandyOrder;
    return {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt)
    };
  });

  const ordenesPagadas = ordenes.filter(o => o.paymentStatus === 'PAGADO');

  // === MÉTRICAS DE VENTAS ===
  const ventasHoy = ordenesPagadas.filter(o => o.createdAt >= startOfToday);
  const ventasSemana = ordenesPagadas.filter(o => o.createdAt >= startOfWeek);
  const ventasMes = ordenesPagadas.filter(o => o.createdAt >= startOfMonth);
  const ventasMesAnterior = ordenesPagadas.filter(
    o => o.createdAt >= startOfLastMonth && o.createdAt <= endOfLastMonth
  );

  const totalHoy = ventasHoy.reduce((sum, o) => sum + o.total, 0);
  const totalSemana = ventasSemana.reduce((sum, o) => sum + o.total, 0);
  const totalMes = ventasMes.reduce((sum, o) => sum + o.total, 0);
  const totalMesAnterior = ventasMesAnterior.reduce((sum, o) => sum + o.total, 0);
  const totalGeneral = ordenesPagadas.reduce((sum, o) => sum + o.total, 0);

  const promedioOrden = ordenesPagadas.length > 0 
    ? totalGeneral / ordenesPagadas.length 
    : 0;

  const ordenMasAlta = ordenesPagadas.length > 0
    ? Math.max(...ordenesPagadas.map(o => o.total))
    : 0;

  const ventas: VentasMetrics = {
    totalHoy,
    totalSemana,
    totalMes,
    totalGeneral,
    promedioOrden,
    ordenMasAlta
  };

  // === MÉTRICAS DE ÓRDENES ===
  const ordenesHoy = ordenes.filter(o => o.createdAt >= startOfToday);
  const ordenesSemana = ordenes.filter(o => o.createdAt >= startOfWeek);
  const ordenesMes = ordenes.filter(o => o.createdAt >= startOfMonth);

  const pendientes = ordenes.filter(o => o.redeemStatus === 'PENDIENTE').length;
  const canjeadas = ordenes.filter(o => o.redeemStatus === 'CANJEADO').length;
  const canceladas = ordenes.filter(o => o.paymentStatus === 'CANCELADO').length;

  const tasaCanje = ordenes.length > 0
    ? (canjeadas / ordenes.length) * 100
    : 0;

  const ordenesMetrics: OrdenesMetrics = {
    totalHoy: ordenesHoy.length,
    totalSemana: ordenesSemana.length,
    totalMes: ordenesMes.length,
    totalGeneral: ordenes.length,
    pendientes,
    canjeadas,
    canceladas,
    tasaCanje
  };

  // === MÉTRICAS DE PRODUCTOS ===
  const productosSnapshot = await db.collection('candyProducts').get();
  const productos = productosSnapshot.docs.map(doc => {
    const data = doc.data() as CandyProduct;
    return {
      ...data,
      id: doc.id
    };
  });

  const productosActivos = productos.filter(p => p.activo).length;
  const productosSinStock = productos.filter(p => p.stock === 0).length;

  // Calcular producto más vendido
  const ventasPorProducto = new Map<string, { nombre: string; cantidad: number }>();

  ordenesPagadas.forEach(orden => {
    orden.items.forEach(item => {
      const actual = ventasPorProducto.get(item.productId) || { nombre: item.nombre, cantidad: 0 };
      ventasPorProducto.set(item.productId, {
        nombre: item.nombre,
        cantidad: actual.cantidad + item.cantidad
      });
    });
  });

  let productoMasVendido: { nombre: string; cantidadVendida: number } | null = null;
  let maxCantidad = 0;

  ventasPorProducto.forEach(({ nombre, cantidad }) => {
    if (cantidad > maxCantidad) {
      maxCantidad = cantidad;
      productoMasVendido = { nombre, cantidadVendida: cantidad };
    }
  });

  const productosMetrics: ProductosMetrics = {
    totalProductos: productos.length,
    productosActivos,
    productosSinStock,
    productoMasVendido
  };

  // === MÉTRICAS DE USUARIOS ===
  const usuariosSnapshot = await db.collection('users').get();
  const usuarios = usuariosSnapshot.docs.map(doc => {
    const data = doc.data() as User;
    return {
      ...data,
      uid: doc.id,
      createdAt: new Date(data.createdAt)
    };
  });

  const nuevosHoy = usuarios.filter(u => u.createdAt >= startOfToday).length;
  const nuevosSemana = usuarios.filter(u => u.createdAt >= startOfWeek).length;
  const nuevosMes = usuarios.filter(u => u.createdAt >= startOfMonth).length;

  const userIdsConCompras = new Set(ordenesPagadas.map(o => o.userId));

  const usuariosMetrics: UsuariosMetrics = {
    totalUsuarios: usuarios.length,
    nuevosHoy,
    nuevosSemana,
    nuevosMes,
    conCompras: userIdsConCompras.size
  };

  // === MÉTRICAS DE PERÍODOS (últimos 7 días) ===
  const ultimosDias: Array<{ fecha: string; ventas: number; ordenes: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - i);
    const startOfDay = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const endOfDay = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59);

    const ordenesDelDia = ordenesPagadas.filter(
      o => o.createdAt >= startOfDay && o.createdAt <= endOfDay
    );

    const ventasDelDia = ordenesDelDia.reduce((sum, o) => sum + o.total, 0);

    ultimosDias.push({
      fecha: fecha.toISOString().split('T')[0],
      ventas: ventasDelDia,
      ordenes: ordenesDelDia.length
    });
  }

  const diferenciaPorcentaje = totalMesAnterior > 0
    ? ((totalMes - totalMesAnterior) / totalMesAnterior) * 100
    : 0;

  const periodos: PeriodosMetrics = {
    ultimosDias,
    comparacionMesAnterior: {
      ventasActual: totalMes,
      ventasAnterior: totalMesAnterior,
      diferenciaPorcentaje
    }
  };

  return {
    ventas,
    ordenes: ordenesMetrics,
    productos: productosMetrics,
    usuarios: usuariosMetrics,
    periodos
  };
};

/**
 * Obtiene métricas de ventas por período personalizado
 */
export const obtenerVentasPorPeriodo = async (
  fechaInicio: Date,
  fechaFin: Date
): Promise<{
  totalVentas: number;
  totalOrdenes: number;
  promedioOrden: number;
  ventasPorDia: Array<{ fecha: string; ventas: number; ordenes: number }>;
}> => {
  const ordenesSnapshot = await db
    .collection('candyOrders')
    .where('paymentStatus', '==', 'PAGADO')
    .where('createdAt', '>=', fechaInicio)
    .where('createdAt', '<=', fechaFin)
    .get();

  const ordenes = ordenesSnapshot.docs.map(doc => {
    const data = doc.data() as CandyOrder;
    return {
      ...data,
      createdAt: toDate(data.createdAt)
    };
  });

  const totalVentas = ordenes.reduce((sum, o) => sum + o.total, 0);
  const totalOrdenes = ordenes.length;
  const promedioOrden = totalOrdenes > 0 ? totalVentas / totalOrdenes : 0;

  const ventasPorDia = new Map<string, { ventas: number; ordenes: number }>();

  ordenes.forEach(orden => {
    const fecha = orden.createdAt.toISOString().split('T')[0];
    const actual = ventasPorDia.get(fecha) || { ventas: 0, ordenes: 0 };
    ventasPorDia.set(fecha, {
      ventas: actual.ventas + orden.total,
      ordenes: actual.ordenes + 1
    });
  });

  const ventasPorDiaArray = Array.from(ventasPorDia.entries())
    .map(([fecha, data]) => ({ fecha, ...data }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return {
    totalVentas,
    totalOrdenes,
    promedioOrden,
    ventasPorDia: ventasPorDiaArray
  };
};

/**
 * Obtiene productos con bajo stock
 */
export const obtenerProductosBajoStock = async (umbral: number = 10) => {
  const snapshot = await db
    .collection('candyProducts')
    .where('activo', '==', true)
    .where('stock', '<=', umbral)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data() as CandyProduct;
    return {
      ...data,
      id: doc.id
    };
  });
};

/**
 * Obtiene el top N de productos más vendidos
 */
export const obtenerTopProductosVendidos = async (limit: number = 10) => {
  const ordenesSnapshot = await db
    .collection('candyOrders')
    .where('paymentStatus', '==', 'PAGADO')
    .get();

  const ventasPorProducto = new Map<string, {
    nombre: string;
    cantidad: number;
    ingresos: number;
  }>();

  ordenesSnapshot.docs.forEach(doc => {
    const orden = doc.data() as CandyOrder;
    orden.items.forEach(item => {
      const actual = ventasPorProducto.get(item.productId) || {
        nombre: item.nombre,
        cantidad: 0,
        ingresos: 0
      };

      ventasPorProducto.set(item.productId, {
        nombre: item.nombre,
        cantidad: actual.cantidad + item.cantidad,
        ingresos: actual.ingresos + item.subtotal
      });
    });
  });

  const topProductos = Array.from(ventasPorProducto.entries())
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limit);

  return topProductos;
};