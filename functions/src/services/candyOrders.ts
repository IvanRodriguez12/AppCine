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

  if (!userId || !items || items.length === 0) {
    throw new Error('Faltan datos obligatorios');
  }

  let subtotalCalculado = 0;

  // --- VALIDACIÓN REALISTA ---
  const batch = db.batch();

  for (const item of items) {
    const productRef = db.collection('candyProducts').doc(item.productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      throw new Error(`El producto ${item.productId} no existe`);
    }

    const producto = productSnap.data() as CandyProduct;

    if (!producto.activo) {
      throw new Error(`El producto ${producto.nombre} no está disponible`);
    }

    // Validar tamaño:
    if (!producto.precios[item.tamanio]) {
      throw new Error(
        `El tamaño "${item.tamanio}" no existe para el producto ${producto.nombre}`
      );
    }

    // Validar precio:
    const precioCorrecto = producto.precios[item.tamanio];
    if (precioCorrecto !== item.precioUnitario) {
      throw new Error(
        `Precio inválido para ${producto.nombre}. Precio real: ${precioCorrecto}`
      );
    }

    // Validar stock:
    if (producto.stock < item.cantidad) {
      throw new Error(
        `No hay stock suficiente de ${producto.nombre}. Disponible: ${producto.stock}`
      );
    }

    // Descontar stock:
    batch.update(productRef, {
      stock: producto.stock - item.cantidad,
      actualizadoEn: new Date(),
    });

    subtotalCalculado += item.cantidad * precioCorrecto;
  }

  const totalCalculado = subtotalCalculado - descuento + feeServicio;

  // Crear orden:
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
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as CandyOrder),
    id: doc.id,
  }));
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

// Tipo de item tal como lo guardamos en metadata de MP
interface CandyOrderMpItem {
  productId: string;
  tamanio: string;
  cantidad: number;
  precioUnitario: number;
  nombre: string;
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

  // Adaptar items del metadata de MP al tipo CandyOrderItem
  const itemsAdaptados: CandyOrderItem[] = items.map((item) => ({
    productId: item.productId,
    nombre: item.nombre ?? '',
    tamanio: item.tamanio,
    precioUnitario: item.precioUnitario,
    cantidad: item.cantidad,
    subtotal: item.cantidad * item.precioUnitario,
  }));

  // Reusar toda la lógica de validación, stock y creación de orden
  return crearOrdenCandy({
    userId,
    items: itemsAdaptados,
    descuento,
    feeServicio,
    paymentMethod: 'mercadopago',
    paymentId,
  });
};