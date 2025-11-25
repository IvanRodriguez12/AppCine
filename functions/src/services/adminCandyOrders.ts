/**
 * services/adminCandyOrders.ts
 * Lógica de negocio para administración de órdenes de Candy
 */

import { db } from '../config/firebase';
import { CandyOrder, CandyPaymentStatus, CandyRedeemStatus } from '../models/candyOrder';
import { User } from '../models/user';

export interface FiltrosOrdenesAdmin {
  paymentStatus?: CandyPaymentStatus;
  redeemStatus?: CandyRedeemStatus;
  userId?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  limit?: number;
  startAfter?: string;
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
 * Obtiene todas las órdenes con filtros avanzados (solo admin)
 */
export const obtenerTodasLasOrdenes = async (filtros: FiltrosOrdenesAdmin = {}) => {
  let query: any = db.collection('candyOrders');

  // Aplicar filtros
  if (filtros.paymentStatus) {
    query = query.where('paymentStatus', '==', filtros.paymentStatus);
  }

  if (filtros.redeemStatus) {
    query = query.where('redeemStatus', '==', filtros.redeemStatus);
  }

  if (filtros.userId) {
    query = query.where('userId', '==', filtros.userId);
  }

  // Filtro de fecha (requiere índice compuesto)
  if (filtros.fechaInicio) {
    query = query.where('createdAt', '>=', filtros.fechaInicio);
  }

  if (filtros.fechaFin) {
    query = query.where('createdAt', '<=', filtros.fechaFin);
  }

  // Ordenar por fecha de creación (más recientes primero)
  query = query.orderBy('createdAt', 'desc');

  // Paginación
  if (filtros.startAfter) {
    const lastDoc = await db.collection('candyOrders').doc(filtros.startAfter).get();
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc);
    }
  }

  // Limitar resultados
  const limit = filtros.limit || 50;
  query = query.limit(limit);

  const snapshot = await query.get();

  const ordenes = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = doc.data() as CandyOrder;
    return {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt)
    };
  });

  const hasMore = ordenes.length === limit;
  const nextPageToken = hasMore ? ordenes[ordenes.length - 1].id : null;

  return {
    ordenes,
    count: ordenes.length,
    hasMore,
    nextPageToken
  };
};

/**
 * Cambia el estado de canje de una orden (ADMIN)
 */
export const cambiarEstadoCanje = async (
  ordenId: string,
  nuevoEstado: CandyRedeemStatus
): Promise<void> => {
  const ordenRef = db.collection('candyOrders').doc(ordenId);
  const ordenSnap = await ordenRef.get();

  if (!ordenSnap.exists) {
    throw new Error('Orden no encontrada');
  }

  const updateData: any = {
    redeemStatus: nuevoEstado,
    updatedAt: new Date()
  };

  if (nuevoEstado === 'CANJEADO') {
    updateData.redeemedAt = new Date();
  } else {
    updateData.redeemedAt = null;
  }

  await ordenRef.update(updateData);
};

/**
 * Cambia el estado de pago de una orden (ADMIN)
 */
export const cambiarEstadoPago = async (
  ordenId: string,
  nuevoEstado: CandyPaymentStatus
): Promise<void> => {
  const ordenRef = db.collection('candyOrders').doc(ordenId);
  const ordenSnap = await ordenRef.get();

  if (!ordenSnap.exists) {
    throw new Error('Orden no encontrada');
  }

  await ordenRef.update({
    paymentStatus: nuevoEstado,
    updatedAt: new Date()
  });
};

/**
 * Cancela una orden (marca como cancelada y libera stock si aplica)
 */
export const cancelarOrden = async (
  ordenId: string,
  razon?: string
): Promise<void> => {
  const ordenRef = db.collection('candyOrders').doc(ordenId);
  const ordenSnap = await ordenRef.get();

  if (!ordenSnap.exists) {
    throw new Error('Orden no encontrada');
  }

  const ordenData = ordenSnap.data() as CandyOrder;

  // No permitir cancelar órdenes ya canjeadas
  if (ordenData.redeemStatus === 'CANJEADO') {
    throw new Error('No se puede cancelar una orden ya canjeada');
  }

  // Batch para actualizar orden y restaurar stock
  const batch = db.batch();

  // Actualizar orden
  batch.update(ordenRef, {
    paymentStatus: 'CANCELADO',
    redeemStatus: 'PENDIENTE',
    canceledAt: new Date(),
    cancellationReason: razon || 'Cancelada por administrador',
    updatedAt: new Date()
  });

  // Restaurar stock de productos
  for (const item of ordenData.items) {
    const productRef = db.collection('candyProducts').doc(item.productId);
    const productSnap = await productRef.get();

    if (productSnap.exists) {
      const currentStock = productSnap.data()?.stock || 0;
      batch.update(productRef, {
        stock: currentStock + item.cantidad,
        actualizadoEn: new Date()
      });
    }
  }

  await batch.commit();

  console.log(`✅ Orden ${ordenId} cancelada y stock restaurado`);
};

/**
 * Obtiene estadísticas de órdenes para reportes
 */
export const obtenerEstadisticasOrdenes = async () => {
  const snapshot = await db.collection('candyOrders').get();
  const ordenes = snapshot.docs.map(doc => {
    const data = doc.data() as CandyOrder;
    return {
      ...data,
      createdAt: toDate(data.createdAt)
    };
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    total: ordenes.length,
    pagadas: ordenes.filter(o => o.paymentStatus === 'PAGADO').length,
    pendientes: ordenes.filter(o => o.paymentStatus === 'PENDIENTE').length,
    canceladas: ordenes.filter(o => o.paymentStatus === 'CANCELADO').length,
    canjeadas: ordenes.filter(o => o.redeemStatus === 'CANJEADO').length,
    porCanjear: ordenes.filter(o => o.redeemStatus === 'PENDIENTE' && o.paymentStatus === 'PAGADO').length,
    hoy: ordenes.filter(o => o.createdAt >= startOfToday).length,
    semana: ordenes.filter(o => o.createdAt >= startOfWeek).length,
    mes: ordenes.filter(o => o.createdAt >= startOfMonth).length,
    ventasTotales: ordenes
      .filter(o => o.paymentStatus === 'PAGADO')
      .reduce((sum, o) => sum + o.total, 0)
  };
};

/**
 * Busca órdenes por código de canje
 */
export const buscarPorCodigoCanje = async (codigo: string) => {
  const codigoUpper = codigo.trim().toUpperCase();

  const snapshot = await db
    .collection('candyOrders')
    .where('redeemCode', '==', codigoUpper)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data() as CandyOrder;
  
  return {
    ...data,
    id: doc.id,
    createdAt: toDate(data.createdAt)
  };
};

/**
 * Obtiene el historial completo de una orden con detalles
 */
export const obtenerDetalleOrdenCompleto = async (ordenId: string) => {
  const ordenSnap = await db.collection('candyOrders').doc(ordenId).get();

  if (!ordenSnap.exists) {
    throw new Error('Orden no encontrada');
  }

  const ordenData = ordenSnap.data() as CandyOrder;

  // Obtener datos del usuario
  let userData = null;
  if (ordenData.userId) {
    const userSnap = await db.collection('users').doc(ordenData.userId).get();
    if (userSnap.exists) {
      const user = userSnap.data() as User;
      userData = {
        uid: userSnap.id,
        displayName: user.displayName,
        email: user.email,
        phone: user.phone
      };
    }
  }

  // Obtener información de productos (para verificar stock actual)
  const productosInfo = [];
  for (const item of ordenData.items) {
    const prodSnap = await db.collection('candyProducts').doc(item.productId).get();
    if (prodSnap.exists) {
      productosInfo.push({
        ...item,
        stockActual: prodSnap.data()?.stock || 0
      });
    } else {
      productosInfo.push({
        ...item,
        stockActual: 'N/A'
      });
    }
  }

  return {
    ...ordenData,
    id: ordenSnap.id,
    createdAt: toDate(ordenData.createdAt),
    usuario: userData,
    productosDetalle: productosInfo
  };
};