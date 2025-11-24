// functions/src/services/paymentsMp.ts
import { db } from '../config/firebase';
import { mpPreference, mpPayment } from '../config/mercadoPago';

interface CandyItemInput {
  productId: string;
  nombre?: string;
  tamanio: string;      // 'pequeño' | 'mediano' | 'grande' | 'único'
  quantity: number;
}

interface CreateCandyPreferenceInput {
  userId: string;
  items: CandyItemInput[];
  description?: string;
}

export async function crearPreferenciaCandyMp(input: CreateCandyPreferenceInput) {
  const { userId, items, description } = input;

  if (!userId) {
    throw new Error('userId es obligatorio');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Debe enviar al menos un item');
  }

  // Revalidar contra Firestore (Candy Products)
  const mpItems: any[] = [];
  const metadataItems: any[] = [];

  for (const item of items) {
    const { productId, tamanio, quantity } = item;

    if (!productId || !tamanio || !quantity || quantity <= 0) {
      throw new Error('Item inválido, falta productId / tamanio / quantity');
    }

    const docRef = db.collection('candyProducts').doc(productId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error(`Producto ${productId} no existe`);
    }

    const data = docSnap.data() as any;

    if (!data.activo) {
      throw new Error(`Producto ${data.nombre ?? productId} no está activo`);
    }

    if (!data.precios || typeof data.precios[tamanio] !== 'number') {
      throw new Error(
        `El producto ${data.nombre ?? productId} no tiene precio para el tamaño ${tamanio}`
      );
    }

    const unitPrice = data.precios[tamanio] as number;

    mpItems.push({
      title: `${data.nombre ?? 'Producto Candy'} - ${tamanio}`,
      quantity,
      unit_price: unitPrice,
      currency_id: 'ARS',
    });

    metadataItems.push({
  productId,
  tamanio,
  cantidad: quantity,
  precioUnitario: unitPrice,
  nombre: data.nombre ?? 'Producto Candy'
});
  }

  const notificationUrl =
    process.env.MP_WEBHOOK_URL ||
    'https://webhook.site/14045216-ec2d-4875-b683-9b49d9421476';

  const body = {
    items: mpItems,
    notification_url: notificationUrl,
    back_urls: {
      success: 'https://example.com/mp/success',
      failure: 'https://example.com/mp/failure',
      pending: 'https://example.com/mp/pending',
    },
    auto_return: 'approved' as const,
    statement_descriptor: 'CineApp Candy',
    metadata: {
      userId,
      tipo: 'candy',
      items: metadataItems,
      description: description ?? 'Compra Candy Shop',
    },
  };

  const preference = await mpPreference.create({ body });

  return {
    id: preference.id,
    init_point: (preference as any).init_point,
    sandbox_init_point: (preference as any).sandbox_init_point,
  };
}

/**
 * Leer un pago de Mercado Pago por ID
 */
export async function obtenerPagoMp(paymentId: string) {
  const res = await mpPayment.get({ id: paymentId });
  return res;
}