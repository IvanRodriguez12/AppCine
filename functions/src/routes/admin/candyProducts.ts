/**
 * routes/admin/candyProducts.ts
 * Rutas de administración para productos de Candy Shop
 */

import { Router } from 'express';
import { db } from '../../config/firebase';
import { verifyToken, requireAdmin, AuthRequest } from '../../middleware/auth';
import { asyncHandler, ApiError } from '../../middleware/errorHandler';
import { CandyProduct } from '../../models/candyProduct';

const router = Router();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(verifyToken);
router.use(requireAdmin);

/**
 * POST /admin/candy-products
 * Crear nuevo producto
 */
router.post('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const {
    nombre,
    tipo,
    categoria,
    precios,
    stock = 0,
    activo = true,
    imageKey = ''
  } = req.body;

  // Validaciones
  if (!nombre || !tipo || !categoria || !precios) {
    throw new ApiError(400, 'Faltan campos requeridos: nombre, tipo, categoria, precios');
  }

  if (typeof stock !== 'number' || stock < 0) {
    throw new ApiError(400, 'Stock debe ser un número >= 0');
  }

  // Validar estructura de precios
  if (typeof precios !== 'object' || !precios.chico || !precios.mediano || !precios.grande) {
    throw new ApiError(400, 'Precios debe tener estructura: { chico: number, mediano: number, grande: number }');
  }

  const nuevoProducto: Partial<CandyProduct> = {
    nombre: nombre.trim(),
    tipo,
    categoria,
    precios,
    stock,
    activo,
    imageKey,
    creadoEn: new Date(),
    actualizadoEn: new Date()
  };

  const docRef = await db.collection('candyProducts').add(nuevoProducto);

  console.log(`🆕 Producto creado por admin ${req.user?.uid}: ${nombre}`);

  res.status(201).json({
    message: 'Producto creado exitosamente',
    productId: docRef.id,
    producto: {
      ...nuevoProducto,
      id: docRef.id
    }
  });
}));

/**
 * GET /admin/candy-products
 * Lista TODOS los productos (activos e inactivos)
 */
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const { activo, sinStock } = req.query;

  let query: any = db.collection('candyProducts');

  // Filtro por estado activo/inactivo
  if (activo !== undefined) {
    const isActivo = activo === 'true';
    query = query.where('activo', '==', isActivo);
  }

  // Filtro por productos sin stock
  if (sinStock === 'true') {
    query = query.where('stock', '==', 0);
  }

  const snapshot = await query.get();

  const productos = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = doc.data() as CandyProduct;
    return {
      ...data,
      id: doc.id
    };
  });

  res.json({
    message: 'Productos obtenidos exitosamente',
    count: productos.length,
    productos
  });
}));

/**
 * GET /admin/candy-products/stats
 * Estadísticas de productos
 */
router.get('/stats', asyncHandler(async (req: AuthRequest, res: any) => {
  const snapshot = await db.collection('candyProducts').get();
  
  const productos = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = doc.data() as CandyProduct;
    return {
      ...data,
      id: doc.id
    };
  });

  const stats = {
    total: productos.length,
    activos: productos.filter(p => p.activo).length,
    inactivos: productos.filter(p => !p.activo).length,
    sinStock: productos.filter(p => p.stock === 0).length,
    bajoStock: productos.filter(p => p.stock > 0 && p.stock <= 10).length,
    porCategoria: {
      bebida: productos.filter(p => p.categoria === 'bebida').length,
      comida: productos.filter(p => p.categoria === 'comida').length,
      otros: productos.filter(p => p.categoria === 'otros').length
    },
    porTipo: {
      promocion: productos.filter(p => p.tipo === 'promocion').length,
      bebida: productos.filter(p => p.tipo === 'bebida').length,
      comida: productos.filter(p => p.tipo === 'comida').length,
      otros: productos.filter(p => p.tipo === 'otros').length
    }
  };

  res.json({
    message: 'Estadísticas de productos',
    data: stats
  });
}));

/**
 * GET /admin/candy-products/bajo-stock
 * Productos con stock bajo (<=10 por defecto)
 */
router.get('/bajo-stock', asyncHandler(async (req: AuthRequest, res: any) => {
  const umbral = req.query.umbral ? Number(req.query.umbral) : 10;

  if (isNaN(umbral) || umbral < 0) {
    throw new ApiError(400, 'El umbral debe ser un número >= 0');
  }

  const snapshot = await db
    .collection('candyProducts')
    .where('activo', '==', true)
    .where('stock', '<=', umbral)
    .get();

  const productos = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = doc.data() as CandyProduct;
    return {
      ...data,
      id: doc.id
    };
  });

  res.json({
    message: 'Productos con bajo stock',
    umbral,
    count: productos.length,
    productos
  });
}));

/**
 * GET /admin/candy-products/:id
 * Obtener producto específico
 */
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const productSnap = await db.collection('candyProducts').doc(id).get();

  if (!productSnap.exists) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  const producto = {
    id: productSnap.id,
    ...productSnap.data()
  } as CandyProduct;

  res.json({
    message: 'Producto obtenido exitosamente',
    producto
  });
}));

/**
 * PUT /admin/candy-products/:id
 * Actualizar producto completo
 */
router.put('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const {
    nombre,
    tipo,
    categoria,
    precios,
    stock,
    activo,
    imageKey
  } = req.body;

  const productRef = db.collection('candyProducts').doc(id);
  const productSnap = await productRef.get();

  if (!productSnap.exists) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  const updateData: any = {
    actualizadoEn: new Date()
  };

  if (nombre !== undefined) updateData.nombre = nombre.trim();
  if (tipo !== undefined) updateData.tipo = tipo;
  if (categoria !== undefined) updateData.categoria = categoria;
  if (precios !== undefined) {
    if (typeof precios !== 'object' || !precios.chico || !precios.mediano || !precios.grande) {
      throw new ApiError(400, 'Precios debe tener estructura: { chico: number, mediano: number, grande: number }');
    }
    updateData.precios = precios;
  }
  if (stock !== undefined) {
    if (typeof stock !== 'number' || stock < 0) {
      throw new ApiError(400, 'Stock debe ser un número >= 0');
    }
    updateData.stock = stock;
  }
  if (activo !== undefined) updateData.activo = activo;
  if (imageKey !== undefined) updateData.imageKey = imageKey;

  await productRef.update(updateData);

  console.log(`✏️ Producto actualizado por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: 'Producto actualizado exitosamente',
    productId: id,
    cambios: Object.keys(updateData).filter(key => key !== 'actualizadoEn')
  });
}));

/**
 * POST /admin/candy-products/bulk-stock
 * Ajustar stock de múltiples productos a la vez
 */
router.post('/bulk-stock', asyncHandler(async (req: AuthRequest, res: any) => {
  const { productos, razon } = req.body;

  if (!Array.isArray(productos) || productos.length === 0) {
    throw new ApiError(400, 'Debe enviar un array de productos con { id, stock }');
  }

  const batch = db.batch();
  const resultados = [];

  for (const item of productos) {
    if (!item.id || typeof item.stock !== 'number' || item.stock < 0) {
      throw new ApiError(400, `Datos inválidos para producto: ${JSON.stringify(item)}`);
    }

    const productRef = db.collection('candyProducts').doc(item.id);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      throw new ApiError(404, `Producto no encontrado: ${item.id}`);
    }

    const producto = productSnap.data() as CandyProduct;
    const stockAnterior = producto.stock;

    // Actualizar en batch
    batch.update(productRef, {
      stock: item.stock,
      actualizadoEn: new Date()
    });

    // Registrar auditoría
    const auditRef = db.collection('candyStockAudit').doc();
    batch.set(auditRef, {
      productId: item.id,
      productName: producto.nombre,
      stockAnterior,
      stockNuevo: item.stock,
      diferencia: item.stock - stockAnterior,
      razon: razon || 'Ajuste masivo por administrador',
      adminId: req.user?.uid,
      action: 'BULK_ADJUSTMENT',
      updatedAt: new Date()
    });

    resultados.push({
      id: item.id,
      nombre: producto.nombre,
      stockAnterior,
      stockNuevo: item.stock,
      diferencia: item.stock - stockAnterior
    });
  }

  await batch.commit();

  console.log(`📦 Stock masivo actualizado por admin ${req.user?.uid}: ${productos.length} productos`);

  res.json({
    message: 'Stock de múltiples productos actualizado exitosamente',
    count: resultados.length,
    resultados
  });
}));

/**
 * DELETE /admin/candy-products/:id/hard-delete
 * Eliminar permanentemente un producto (use con precaución)
 */
router.delete('/:id/hard-delete', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { confirmar } = req.body;

  if (confirmar !== 'SI_ELIMINAR_PERMANENTEMENTE') {
    throw new ApiError(400, 'Debe confirmar la eliminación permanente enviando: { "confirmar": "SI_ELIMINAR_PERMANENTEMENTE" }');
  }

  const productRef = db.collection('candyProducts').doc(id);
  const productSnap = await productRef.get();

  if (!productSnap.exists) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  const producto = productSnap.data() as CandyProduct;

  // Verificar si el producto tiene órdenes asociadas
  const ordenesSnapshot = await db
    .collection('candyOrders')
    .where('items', 'array-contains', { productId: id })
    .limit(1)
    .get();

  if (!ordenesSnapshot.empty) {
    throw new ApiError(400, 'No se puede eliminar un producto que tiene órdenes asociadas. Use desactivación en su lugar.');
  }

  // Eliminar producto
  await productRef.delete();

  console.log(`🗑️  Producto eliminado permanentemente por admin ${req.user?.uid}: ${producto.nombre} (${id})`);

  res.json({
    message: 'Producto eliminado permanentemente',
    productId: id,
    productName: producto.nombre,
    warning: 'Esta acción no se puede deshacer'
  });
}));

/**
 * PUT /admin/candy-products/:id/activate
 * Activar o desactivar un producto
 */
router.put('/:id/activate', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { activo } = req.body;

  if (typeof activo !== 'boolean') {
    throw new ApiError(400, 'El campo activo debe ser booleano (true/false)');
  }

  const productRef = db.collection('candyProducts').doc(id);
  const productSnap = await productRef.get();

  if (!productSnap.exists) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  await productRef.update({
    activo,
    actualizadoEn: new Date()
  });

  console.log(`✅ Producto ${activo ? 'activado' : 'desactivado'} por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: `Producto ${activo ? 'activado' : 'desactivado'} exitosamente`,
    productId: id,
    nuevoEstado: activo
  });
}));

/**
 * PUT /admin/candy-products/:id/stock
 * Ajustar stock de un producto (con auditoría)
 */
router.put('/:id/stock', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { stock, razon } = req.body;

  if (typeof stock !== 'number' || stock < 0) {
    throw new ApiError(400, 'El stock debe ser un número >= 0');
  }

  const productRef = db.collection('candyProducts').doc(id);
  const productSnap = await productRef.get();

  if (!productSnap.exists) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  const producto = productSnap.data() as CandyProduct;
  const stockAnterior = producto.stock;

  // Actualizar stock
  await productRef.update({
    stock,
    actualizadoEn: new Date()
  });

  // Registrar en auditoría
  await db.collection('candyStockAudit').add({
    productId: id,
    productName: producto.nombre,
    stockAnterior,
    stockNuevo: stock,
    diferencia: stock - stockAnterior,
    razon: razon || 'Ajuste manual por administrador',
    adminId: req.user?.uid,
    action: 'ADMIN_ADJUSTMENT',
    updatedAt: new Date()
  });

  console.log(`📦 Stock ajustado por admin ${req.user?.uid}: ${producto.nombre} (${stockAnterior} → ${stock})`);

  res.json({
    message: 'Stock actualizado exitosamente',
    productId: id,
    productName: producto.nombre,
    stockAnterior,
    stockNuevo: stock,
    diferencia: stock - stockAnterior
  });
}));

/**
 * GET /admin/candy-products/:id/audit
 * Historial de cambios de stock de un producto
 */
router.get('/:id/audit', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const limit = req.query.limit ? Number(req.query.limit) : 50;

  const snapshot = await db
    .collection('candyStockAudit')
    .where('productId', '==', id)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();

  const historial = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data()
  }));

  res.json({
    message: 'Historial de cambios de stock',
    productId: id,
    count: historial.length,
    historial
  });
}));

export default router;