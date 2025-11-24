// functions/src/routes/candyProducts.ts
import { Router } from 'express';
import { db } from '../config/firebase';
import {
  obtenerProductosCandy,
  obtenerProductoCandy,
  crearProductoCandy,
  actualizarProductoCandy,
  eliminarProductoCandy,
} from '../services/candyProducts';

const router = Router();

// GET /api/candy-products -> lista productos activos
router.get('/', async (_req, res) => {
  try {
    const productos = await obtenerProductosCandy();
    res.json(productos);
  } catch (error: any) {
    console.error('Error obteniendo productos de Candy Shop:', error);
    res.status(500).json({ error: 'Error obteniendo productos' });
  }
});

// GET /api/candy-products/:id -> producto por id
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const producto = await obtenerProductoCandy(req.params.id);
    if (!producto) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json(producto);
    return;
  } catch (error: any) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ error: 'Error obteniendo producto' });
    return;
  }
});

// POST /api/candy-products -> crear producto
router.post('/', async (req, res) => {
  try {
    const creado = await crearProductoCandy(req.body);
    res.status(201).json(creado);
  } catch (error: any) {
    console.error('Error creando producto:', error);
    res.status(400).json({ error: error.message ?? 'Error creando producto' });
  }
});

// PUT /api/candy-products/:id -> actualizar producto
router.put('/:id', async (req, res): Promise<void> => {
  try {
    const actualizado = await actualizarProductoCandy(req.params.id, req.body);
    if (!actualizado) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json(actualizado);
    return;
  } catch (error: any) {
    console.error('Error actualizando producto:', error);
    res.status(400).json({ error: error.message ?? 'Error actualizando producto' });
    return;
  }
});

// PUT /api/candy-products/:id/restock -> modificar stock
router.put('/:id/restock', async (req, res) => {
  try {
    const { stock } = req.body;

    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ error: 'El stock debe ser un número >= 0' });
    }

    const ref = db.collection('candyProducts').doc(req.params.id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await ref.update({
      stock,
      actualizadoEn: new Date()
    });

    await db.collection('candyStockAudit').add({
      productId: req.params.id,
      newStock: stock,
      updatedAt: new Date(),
      action: 'RESTOCK'
    });

    const actualizado = await ref.get();
    return res.json({ id: actualizado.id, ...actualizado.data() });

  } catch (error) {
    console.error('Error restock:', error);
    return res.status(500).json({ error: 'Error actualizando stock' });
  }
});

// DELETE /api/candy-products/:id -> borrado lógico
router.delete('/:id', async (req, res) => {
  try {
    await eliminarProductoCandy(req.params.id);
    res.json({ ok: true });
  } catch (error: any) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ error: 'Error eliminando producto' });
  }
});

export default router;