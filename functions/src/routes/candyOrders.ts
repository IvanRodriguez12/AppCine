// functions/src/routes/candyOrders.ts
import { Router } from 'express';
import { db } from '../config/firebase';
import {
  crearOrdenCandy,
  obtenerOrdenCandyPorId,
  obtenerOrdenesCandyPorUsuario,
  canjearOrdenCandyPorCodigo,
  obtenerOrdenCandyPorPaymentId,  
  obtenerResumenCandyOrders,
} from '../services/candyOrders';

const router = Router();

// POST /api/candy-orders
// Crea una orden de Candy Shop ya pagada y genera código de canje
router.post('/', async (req, res): Promise<void> => {
  try {
    const orden = await crearOrdenCandy(req.body);
    res.status(201).json(orden);
    return;
  } catch (error: any) {
    console.error('Error creando orden de Candy:', error);
    res.status(400).json({ error: error.message ?? 'Error creando orden' });
    return;
  }
});

// GET /api/candy-orders/by-payment/:paymentId
// Buscar una orden de Candy por el id de pago de Mercado Pago
router.get('/by-payment/:paymentId', async (req, res): Promise<void> => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      res.status(400).json({ error: 'Debe enviar un paymentId' });
      return;
    }

    const orden = await obtenerOrdenCandyPorPaymentId(paymentId);

    if (!orden) {
      res.status(404).json({ error: 'Orden no encontrada para ese paymentId' });
      return;
    }

    res.json(orden);
    return;
  } catch (error: any) {
    console.error('Error obteniendo orden por paymentId:', error);
    res.status(500).json({ error: 'Error obteniendo orden por paymentId' });
    return;
  }
});

// GET /api/candy-orders/stats/summary
// Devuelve un resumen general de órdenes de Candy
router.get('/stats/summary', async (req, res): Promise<void> => {
  try {
    const resumen = await obtenerResumenCandyOrders();
    res.json(resumen);
    return;
  } catch (error: any) {
    console.error('Error obteniendo resumen de órdenes de Candy:', error);
    res.status(500).json({ error: 'Error obteniendo resumen de órdenes' });
    return;
  }
});

// GET /api/candy-orders/:id
// Ver detalle de una orden
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const orden = await obtenerOrdenCandyPorId(req.params.id);
    if (!orden) {
      res.status(404).json({ error: 'Orden no encontrada' });
      return;
    }
    res.json(orden);
    return;
  } catch (error: any) {
    console.error('Error obteniendo orden de Candy:', error);
    res.status(500).json({ error: 'Error obteniendo orden' });
    return;
  }
});

// GET /api/candy-orders/user/:userId
// Historial de órdenes de Candy de un usuario
router.get('/user/:userId', async (req, res): Promise<void> => {
  try {
    const ordenes = await obtenerOrdenesCandyPorUsuario(req.params.userId);
    res.json(ordenes);
    return;
  } catch (error: any) {
    console.error('Error obteniendo órdenes de usuario:', error);
    res.status(500).json({ error: 'Error obteniendo órdenes' });
    return;
  }
});

// GET /api/candy-orders/redeem/:code -> consultar estado de un código
router.get('/redeem/:code', async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();

    const snap = await db
      .collection('candyOrders')
      .where('redeemCode', '==', code)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: 'Código inválido' });
    }

    const doc = snap.docs[0];
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error consultando código:', error);
    return res.status(500).json({ error: 'Error consultando código' });
  }
});

// POST /api/candy-orders/redeem
// Canjea una orden a partir de un código
router.post('/redeem', async (req, res): Promise<void> => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Debe enviar un código de canje válido' });
      return;
    }

    const orden = await canjearOrdenCandyPorCodigo(code.trim().toUpperCase());
    res.json(orden);
    return;
  } catch (error: any) {
    console.error('Error canjeando orden de Candy:', error);
    res.status(400).json({ error: error.message ?? 'Error canjeando orden' });
    return;
  }
});

export default router;