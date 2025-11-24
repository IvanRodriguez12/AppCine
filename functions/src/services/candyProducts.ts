// functions/src/services/candyProducts.ts
import { db } from '../config/firebase';
import { CandyProduct } from '../models/candyProduct';

const COLLECTION = 'candyProducts';

export const obtenerProductosCandy = async (): Promise<CandyProduct[]> => {
  const snapshot = await db
    .collection(COLLECTION)
    .where('activo', '==', true)
    .get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as CandyProduct),
    id: doc.id,
  }));
};

export const obtenerProductoCandy = async (
  id: string
): Promise<CandyProduct | null> => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;

  return { ...(doc.data() as CandyProduct), id };
};

export const crearProductoCandy = async (
  data: Partial<CandyProduct>
): Promise<CandyProduct> => {
  const { nombre, tipo, categoria, precios, imageKey, stock } = data;

  if (!nombre || !tipo || !categoria || !precios || !imageKey || !stock) {
    throw new Error('Faltan campos obligatorios');
  }

  if (typeof data.stock !== 'number') {
    throw new Error('Debe enviar stock numérico');
  }


  const now = new Date();

  const nuevo: Omit<CandyProduct, 'id'> = {
    nombre,
    tipo,
    categoria,
    precios,
    imageKey,
    stock,
    activo: true,
    creadoEn: now as any,
    actualizadoEn: now as any,
  };

  const ref = await db.collection(COLLECTION).add(nuevo);
  const creado = await ref.get();

  return { ...(creado.data() as CandyProduct), id: ref.id };
};

export const actualizarProductoCandy = async (
  id: string,
  data: Partial<CandyProduct>
): Promise<CandyProduct | null> => {
  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;

  const now = new Date();

  const updateData: Partial<CandyProduct> = {
    ...data,
    actualizadoEn: now as any,
  };

  await docRef.update(updateData);
  const actualizado = await docRef.get();

  return { ...(actualizado.data() as CandyProduct), id };
};

export const eliminarProductoCandy = async (id: string): Promise<void> => {
  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return;

  const now = new Date();

  await docRef.update({
    activo: false,
    actualizadoEn: now as any,
  });
};