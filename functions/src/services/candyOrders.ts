// functions/src/services/candyOrders.ts
import { db } from '../config/firebase';
import { CandyOrder, CandyOrderItem } from '../models/candyOrder';
import { CandyProduct } from '../models/candyProduct';

const COLLECTION = 'candyOrders';

const generarCodigoCanje = (longitud = 8): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < longitud; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const crearOrdenCandy = async (data: {
  userId: string;
  items: CandyOrderItem[];
  descuento: number;
  feeServicio: number;
  paymentMethod: 'mercadopago' | 'efectivo';
  paymentId?: string;
}): Promise<CandyOrder> => {
  const { userId, items, descuento, feeServicio, paymentMethod, paymentId } = data;

  // Validación básica de entrada
  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Faltan datos obligatorios');
  }

  let subtotalCalculado = 0;
  const batch = db.batch();

  for (const item of items) {
    // Validar datos mínimos del item
    if (!item.productId || !item.tamanio || !item.cantidad || item.cantidad <= 0) {
      throw new Error('Item inválido en la orden de Candy');
    }

    const productRef = db.collection('candyProducts').doc(item.productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      throw new Error(`El producto ${item.productId} no existe`);
    }

    const producto = productSnap.data() as CandyProduct;

    if (!producto.activo) {
      throw new Error(`El producto ${producto.nombre} no está disponible`);
    }

    // Validar que el tamaño exista
    const precioCorrecto = producto.precios[item.tamanio];

    if (typeof precioCorrecto !== 'number') {
      throw new Error(
        `El tamaño "${item.tamanio}" no existe para el producto ${producto.nombre}`
      );
    }

    // Validar precio (tolerancia pequeña por posibles decimales)
    const diff = Math.abs(precioCorrecto - item.precioUnitario);
    if (diff > 0.001) {
      throw new Error(
        `Precio inválido para ${producto.nombre}. Precio real: ${precioCorrecto}`
      );
    }

    // Validar stock
    if (producto.stock < item.cantidad) {
      throw new Error(
        `No hay stock suficiente de ${producto.nombre}. Disponible: ${producto.stock}`
      );
    }

    // Descontar stock en batch
    batch.update(productRef, {
      stock: producto.stock - item.cantidad,
      actualizadoEn: new Date(),
    });

    subtotalCalculado += item.cantidad * precioCorrecto;
  }

  const totalCalculado = subtotalCalculado - descuento + feeServicio;

  const now = new Date();
  const redeemCode = generarCodigoCanje(8);

  const nuevaOrden: Omit<CandyOrder, 'id'> = {
    userId,
    items,
    subtotal: subtotalCalculado,
    descuento,
    feeServicio,
    total: totalCalculado,
    paymentMethod,
    paymentStatus: 'PAGADO',
    paymentId,
    redeemCode,
    redeemStatus: 'PENDIENTE',
    redeemedAt: null,
    createdAt: now,
  };

  const orderRef = db.collection(COLLECTION).doc();
  batch.set(orderRef, nuevaOrden);

  await batch.commit();

  return { ...nuevaOrden, id: orderRef.id };
};

export const obtenerOrdenCandyPorId = async (
  id: string
): Promise<CandyOrder | null> => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;

  return { ...(doc.data() as CandyOrder), id };
};

export const obtenerOrdenesCandyPorUsuario = async (
  userId: string
): Promise<CandyOrder[]> => {
  const snapshot = await db
    .collection(COLLECTION)
    .where('userId', '==', userId)
    .get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as CandyOrder),
    id: doc.id,
  }));
};

export const obtenerOrdenCandyPorPaymentId = async (
  paymentId: string
): Promise<CandyOrder | null> => {
  if (!paymentId) {
    throw new Error('paymentId es obligatorio');
  }

  const snapshot = await db
    .collection(COLLECTION)
    .where('paymentId', '==', paymentId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { ...(doc.data() as CandyOrder), id: doc.id };
};

export const canjearOrdenCandyPorCodigo = async (
  code: string
): Promise<CandyOrder> => {
  const snapshot = await db
    .collection(COLLECTION)
    .where('redeemCode', '==', code)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error('Código de canje inválido');
  }

  const doc = snapshot.docs[0];
  const data = doc.data() as CandyOrder;

  if (data.redeemStatus === 'CANJEADO') {
    throw new Error('Este código ya fue canjeado');
  }

  if (data.paymentStatus !== 'PAGADO') {
    throw new Error('La orden aún no está paga');
  }

  const now = new Date();

  await doc.ref.update({
    redeemStatus: 'CANJEADO',
    redeemedAt: now,
  });

  const actualizado = await doc.ref.get();

  return {
    ...(actualizado.data() as CandyOrder),
    id: doc.id,
  };
};

// ================== INTEGRACIÓN CON MERCADO PAGO ==================

interface CandyOrderMpItem {
  productId?: string;
  product_id?: string;  
  tamanio?: string;
  cantidad?: number;
  quantity?: number;
  precioUnitario?: number;
  precio_unitario?: number;
  nombre?: string;
  title?: string;
}

/**
 * Crea una orden de candy usando los datos que vienen de Mercado Pago.
 * Reusa la lógica de crearOrdenCandy (valida precios, stock, etc.).
 */
export const crearOrdenCandyDesdePagoMp = async (data: {
  userId: string;
  items: CandyOrderMpItem[];
  paymentId: string;
  descuento?: number;
  feeServicio?: number;
}): Promise<CandyOrder> => {
  const {
    userId,
    items,
    paymentId,
    descuento = 0,
    feeServicio = 0,
  } = data;

  const ordenExistente = await obtenerOrdenCandyPorPaymentId(paymentId);
  if (ordenExistente) {
    console.log(
      `Orden ya existente para paymentId=${paymentId}. Evitando duplicado.`
    );
    return ordenExistente;
  }

  const itemsAdaptados: CandyOrderItem[] = [];

  for (const raw of items) {
    // Normalización robusta
    const productId =
      raw.productId ??
      raw.product_id;

    const tamanio = raw.tamanio;

    const cantidad =
      raw.cantidad ??
      raw.quantity;

    // Validación mínima antes de consultar Firestore
    if (!productId || !tamanio || !cantidad || cantidad <= 0) {
      console.warn('Item inválido en metadata MP (se ignora):', raw);
      continue;
    }

    // Obtener el producto real desde Firestore
    const productSnap = await db
      .collection('candyProducts')
      .doc(productId)
      .get();

    if (!productSnap.exists) {
      console.warn(`Producto ${productId} no existe en Firestore (se ignora item)`);
      continue;
    }

    const producto = productSnap.data() as CandyProduct;

    if (!producto.activo) {
      console.warn(`Producto ${producto.nombre} no está activo (se ignora item)`);
      continue;
    }

    const precioUnitario = producto.precios[tamanio];

    if (typeof precioUnitario !== 'number') {
      console.warn(
        `Producto ${producto.nombre} no tiene precio para tamaño "${tamanio}" (se ignora item)`
      );
      continue;
    }

    // Construir item adaptado
    itemsAdaptados.push({
      productId,
      nombre: producto.nombre, // SIEMPRE usamos el real
      tamanio,
      precioUnitario,
      cantidad,
      subtotal: cantidad * precioUnitario,
    });
  }

  if (!itemsAdaptados.length) {
    throw new Error('No hay ítems válidos en metadata de MP');
  }

  // Crear orden reutilizando toda tu lógica original
  return crearOrdenCandy({
    userId,
    items: itemsAdaptados,
    descuento,
    feeServicio,
    paymentMethod: 'mercadopago',
    paymentId: String(paymentId),
  });
};

// Resumen simple de órdenes de Candy
export const obtenerResumenCandyOrders = async (): Promise<{
  totalOrders: number;
  totalPaid: number;
  totalPending: number;
  totalCancelled: number;
  totalRevenue: number; // solo órdenes pagadas
}> => {
  const snapshot = await db.collection(COLLECTION).get();

  let totalOrders = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalCancelled = 0;
  let totalRevenue = 0;

  snapshot.forEach((doc) => {
    const data = doc.data() as CandyOrder;
    totalOrders++;

    switch (data.paymentStatus) {
      case 'PAGADO':
        totalPaid++;
        totalRevenue += data.total || 0;
        break;
      case 'PENDIENTE':
        totalPending++;
        break;
      case 'CANCELADO':
        totalCancelled++;
        break;
    }
  });

  return {
    totalOrders,
    totalPaid,
    totalPending,
    totalCancelled,
    totalRevenue,
  };
};