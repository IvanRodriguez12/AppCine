/**
 * routes/admin/coupons.ts
 * Rutas de administración para gestión de cupones
 */

import * as admin from 'firebase-admin';
import { Router } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../middleware/auth';
import { asyncHandler, ApiError } from '../../middleware/errorHandler';
import { db } from '../../config/firebase';
import { Coupon, CouponScope, CouponMode } from '../../models/coupon';


const router = Router();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(verifyToken);
router.use(requireAdmin);

/**
 * Interfaz para filtros de listado
 */
interface FiltrosCupones {
  scope?: CouponScope;
  mode?: CouponMode;
  active?: boolean;
  premiumOnly?: boolean;
  limit?: number;
  startAfter?: string;
}

/**
 * Interfaz para estadísticas
 */
interface EstadisticasCupones {
  total: number;
  activos: number;
  inactivos: number;
  porScope: Record<CouponScope, number>;
  porModo: Record<CouponMode, number>;
  premiumOnly: number;
  expirados: number;
  proximosAExpirar: number; // Próximos 7 días
}

/**
 * GET /admin/coupons
 * Listar todos los cupones con filtros
 */
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const {
    scope,
    mode,
    active,
    premiumOnly,
    limit,
    startAfter
  } = req.query;

  // Construir filtros tipados
  const filtros: FiltrosCupones = {};

  let query: any = db.collection('coupons');

  // Aplicar filtros
  if (scope && ['tickets', 'candyshop', 'both'].includes(scope as string)) {
    filtros.scope = scope as CouponScope;
    query = query.where('scope', '==', scope);
  }

  if (mode && ['fixed', 'percent', '2x1', '3x2'].includes(mode as string)) {
    filtros.mode = mode as CouponMode;
    query = query.where('mode', '==', mode);
  }

  if (active !== undefined) {
    const isActive = String(active) === 'true';
    filtros.active = isActive;
    query = query.where('active', '==', isActive);
  }

  if (premiumOnly !== undefined) {
    const isPremium = String(premiumOnly) === 'true';
    filtros.premiumOnly = isPremium;
    query = query.where('premiumOnly', '==', isPremium);
  }

  // Ordenar por fecha de creación (más recientes primero)
  query = query.orderBy('createdAt', 'desc');

  // Paginación
  const pageLimit = limit ? Math.min(Number(limit), 100) : 50;
  filtros.limit = pageLimit;
  query = query.limit(pageLimit);

  if (startAfter) {
    filtros.startAfter = startAfter as string;
    const lastDoc = await db.collection('coupons').doc(startAfter as string).get();
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc);
    }
  }

  const snapshot = await query.get();

  const coupons: Coupon[] = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data()
  } as Coupon));

  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  res.json({
    message: 'Cupones obtenidos exitosamente',
    filtros: filtros,
    data: coupons,
    pagination: {
      count: coupons.length,
      hasMore: coupons.length === pageLimit,
      lastDocId: lastVisible ? lastVisible.id : null
    }
  });
}));

/**
 * GET /admin/coupons/stats
 * Estadísticas generales de cupones
 */
router.get('/stats', asyncHandler(async (req: AuthRequest, res: any) => {
  const snapshot = await db.collection('coupons').get();

  const stats: EstadisticasCupones = {
    total: 0,
    activos: 0,
    inactivos: 0,
    porScope: { tickets: 0, candyshop: 0, both: 0 },
    porModo: { fixed: 0, percent: 0, '2x1': 0, '3x2': 0 },
    premiumOnly: 0,
    expirados: 0,
    proximosAExpirar: 0
  };

  const now = new Date();
  const proximos7Dias = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  snapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const coupon = doc.data() as Coupon;
    stats.total++;

    // Activos/Inactivos
    if (coupon.active) {
      stats.activos++;
    } else {
      stats.inactivos++;
    }

    // Por scope
    if (coupon.scope in stats.porScope) {
      stats.porScope[coupon.scope]++;
    }

    // Por modo
    if (coupon.mode in stats.porModo) {
      stats.porModo[coupon.mode]++;
    }

    // Premium only
    if (coupon.premiumOnly) {
      stats.premiumOnly++;
    }

    // Expirados y próximos a expirar
    if (coupon.validTo) {
      const validTo = coupon.validTo.toDate();
      if (validTo < now) {
        stats.expirados++;
      } else if (validTo < proximos7Dias) {
        stats.proximosAExpirar++;
      }
    }
  });

  res.json({
    message: 'Estadísticas de cupones',
    data: stats
  });
}));

/**
 * GET /admin/coupons/search/:code
 * Buscar cupón por código
 */
router.get('/search/:code', asyncHandler(async (req: AuthRequest, res: any) => {
  const { code } = req.params;

  if (!code || code.length < 2) {
    throw new ApiError(400, 'Código de cupón inválido (mínimo 2 caracteres)');
  }

  const upperCode = code.trim().toUpperCase();

  const snapshot = await db
    .collection('coupons')
    .where('code', '==', upperCode)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new ApiError(404, 'Cupón no encontrado');
  }

  const doc = snapshot.docs[0];
  const coupon: Coupon = {
    id: doc.id,
    ...doc.data()
  } as Coupon;

  res.json({
    message: 'Cupón encontrado',
    coupon
  });
}));

/**
 * GET /admin/coupons/:id
 * Ver detalles de un cupón específico
 */
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const doc = await db.collection('coupons').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Cupón no encontrado');
  }

  const coupon: Coupon = {
    id: doc.id,
    ...doc.data()
  } as Coupon;

  res.json({
    message: 'Detalle del cupón',
    coupon
  });
}));

/**
 * POST /admin/coupons
 * Crear un nuevo cupón
 */
router.post('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const {
    code,
    scope,
    mode,
    value,
    buyQuantity,
    payQuantity,
    premiumOnly,
    minAmount,
    maxDiscount,
    validFrom,
    validTo
  } = req.body;

  // Validaciones
  if (!code || typeof code !== 'string' || code.trim().length < 2) {
    throw new ApiError(400, 'El código del cupón es requerido (mínimo 2 caracteres)');
  }

  if (!['tickets', 'candyshop', 'both'].includes(scope)) {
    throw new ApiError(400, 'scope debe ser: tickets, candyshop o both');
  }

  if (!['fixed', 'percent', '2x1', '3x2'].includes(mode)) {
    throw new ApiError(400, 'mode debe ser: fixed, percent, 2x1 o 3x2');
  }

  const upperCode = code.trim().toUpperCase();

  // Verificar que no exista
  const existente = await db
    .collection('coupons')
    .where('code', '==', upperCode)
    .limit(1)
    .get();

  if (!existente.empty) {
    throw new ApiError(409, `Ya existe un cupón con el código: ${upperCode}`);
  }

  // Validaciones según el modo
  if (mode === 'fixed' || mode === 'percent') {
    if (value === undefined || value === null) {
      throw new ApiError(400, `El campo "value" es requerido para el modo ${mode}`);
    }
    if (mode === 'percent' && (value < 0 || value > 100)) {
      throw new ApiError(400, 'El valor de porcentaje debe estar entre 0 y 100');
    }
  }

  if (mode === '2x1' || mode === '3x2') {
    if (!buyQuantity || !payQuantity) {
      throw new ApiError(400, `Los campos "buyQuantity" y "payQuantity" son requeridos para el modo ${mode}`);
    }
  }

  const newCoupon: Omit<Coupon, 'id'> = {
    code: upperCode,
    scope,
    mode,
    value: value || undefined,
    buyQuantity: buyQuantity || undefined,
    payQuantity: payQuantity || undefined,
    premiumOnly: premiumOnly ?? false,
    minAmount: minAmount || undefined,
    maxDiscount: maxDiscount || undefined,
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp() as any,
    validFrom: validFrom ? new Date(validFrom) as any : undefined,
    validTo: validTo ? new Date(validTo) as any : undefined
  };

  const docRef = await db.collection('coupons').add(newCoupon);

  console.log(`✅ Cupón creado por admin ${req.user?.uid}: ${upperCode} (${docRef.id})`);

  res.status(201).json({
    message: 'Cupón creado exitosamente',
    couponId: docRef.id,
    code: upperCode
  });
}));

/**
 * POST /admin/coupons/bulk
 * Crear múltiples cupones con prefijo + número secuencial
 * 
 * Body:
 * {
 *   "prefix": "SUMMER",
 *   "quantity": 100,
 *   "scope": "tickets",
 *   "mode": "percent",
 *   "value": 20,
 *   ...resto de campos del cupón
 * }
 */
router.post('/bulk', asyncHandler(async (req: AuthRequest, res: any) => {
  const {
    prefix,
    quantity,
    scope,
    mode,
    value,
    buyQuantity,
    payQuantity,
    premiumOnly,
    minAmount,
    maxDiscount,
    validFrom,
    validTo
  } = req.body;

  if (!prefix || typeof prefix !== 'string' || prefix.trim().length < 2) {
    throw new ApiError(400, 'El prefijo es requerido (mínimo 2 caracteres)');
  }

  if (!quantity || quantity < 1 || quantity > 1000) {
    throw new ApiError(400, 'La cantidad debe estar entre 1 y 1000');
  }

  if (!['tickets', 'candyshop', 'both'].includes(scope)) {
    throw new ApiError(400, 'scope debe ser: tickets, candyshop o both');
  }

  if (!['fixed', 'percent', '2x1', '3x2'].includes(mode)) {
    throw new ApiError(400, 'mode debe ser: fixed, percent, 2x1 o 3x2');
  }

  const upperPrefix = prefix.trim().toUpperCase();
  const batch = db.batch();
  const createdCodes: string[] = [];

  for (let i = 1; i <= quantity; i++) {
    const code = `${upperPrefix}${String(i).padStart(4, '0')}`; // ej: SUMMER0001
    
    const newCoupon: Omit<Coupon, 'id'> = {
      code,
      scope,
      mode,
      value: value || undefined,
      buyQuantity: buyQuantity || undefined,
      payQuantity: payQuantity || undefined,
      premiumOnly: premiumOnly ?? false,
      minAmount: minAmount || undefined,
      maxDiscount: maxDiscount || undefined,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp() as any,
      validFrom: validFrom ? new Date(validFrom) as any : undefined,
      validTo: validTo ? new Date(validTo) as any : undefined
    };

    const docRef = db.collection('coupons').doc();
    batch.set(docRef, newCoupon);
    createdCodes.push(code);
  }

  await batch.commit();

  console.log(`✅ ${quantity} cupones creados en bulk por admin ${req.user?.uid}: ${upperPrefix}XXXX`);

  res.status(201).json({
    message: `${quantity} cupones creados exitosamente`,
    prefix: upperPrefix,
    quantity,
    codes: createdCodes
  });
}));

/**
 * PUT /admin/coupons/:id
 * Actualizar un cupón existente
 */
router.put('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const updates = req.body;

  const doc = await db.collection('coupons').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Cupón no encontrado');
  }

  // No permitir cambiar el código
  if (updates.code) {
    throw new ApiError(400, 'No se puede cambiar el código de un cupón existente');
  }

  // Validar campos si están presentes
  if (updates.scope && !['tickets', 'candyshop', 'both'].includes(updates.scope)) {
    throw new ApiError(400, 'scope debe ser: tickets, candyshop o both');
  }

  if (updates.mode && !['fixed', 'percent', '2x1', '3x2'].includes(updates.mode)) {
    throw new ApiError(400, 'mode debe ser: fixed, percent, 2x1 o 3x2');
  }

  if (updates.mode === 'percent' && updates.value && (updates.value < 0 || updates.value > 100)) {
    throw new ApiError(400, 'El valor de porcentaje debe estar entre 0 y 100');
  }

  // Preparar updates
  const validUpdates: any = {};

  const allowedFields = [
    'scope', 'mode', 'value', 'buyQuantity', 'payQuantity',
    'premiumOnly', 'minAmount', 'maxDiscount', 'active',
    'validFrom', 'validTo'
  ];

  allowedFields.forEach(field => {
    if (field in updates) {
      if (field === 'validFrom' || field === 'validTo') {
        validUpdates[field] = updates[field] ? new Date(updates[field]) : null;
      } else {
        validUpdates[field] = updates[field];
      }
    }
  });

  if (Object.keys(validUpdates).length === 0) {
    throw new ApiError(400, 'No hay campos válidos para actualizar');
  }

  await db.collection('coupons').doc(id).update(validUpdates);

  console.log(`✅ Cupón actualizado por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: 'Cupón actualizado exitosamente',
    couponId: id,
    updates: validUpdates
  });
}));

/**
 * PUT /admin/coupons/:id/toggle
 * Activar/desactivar un cupón
 */
router.put('/:id/toggle', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const doc = await db.collection('coupons').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Cupón no encontrado');
  }

  const currentData = doc.data() as Coupon;
  const newStatus = !currentData.active;

  await db.collection('coupons').doc(id).update({
    active: newStatus
  });

  console.log(`🔄 Cupón ${newStatus ? 'activado' : 'desactivado'} por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: `Cupón ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
    couponId: id,
    active: newStatus
  });
}));

/**
 * DELETE /admin/coupons/:id
 * Eliminar un cupón (soft delete - solo desactivar)
 */
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { hardDelete } = req.query;

  const doc = await db.collection('coupons').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Cupón no encontrado');
  }

  if (hardDelete === 'true') {
    // Eliminar permanentemente
    await db.collection('coupons').doc(id).delete();
    console.log(`🗑️  Cupón eliminado permanentemente por admin ${req.user?.uid}: ${id}`);
    
    res.json({
      message: 'Cupón eliminado permanentemente',
      couponId: id
    });
  } else {
    // Soft delete - solo desactivar
    await db.collection('coupons').doc(id).update({
      active: false
    });
    console.log(`🚫 Cupón desactivado (soft delete) por admin ${req.user?.uid}: ${id}`);
    
    res.json({
      message: 'Cupón desactivado (soft delete)',
      couponId: id,
      note: 'Use ?hardDelete=true para eliminación permanente'
    });
  }
}));

/**
 * GET /admin/coupons/:id/usage
 * Ver historial de uso de un cupón (requiere implementar tracking)
 * 
 * NOTA: Esta funcionalidad requiere que guardes el uso de cupones en otra colección
 * Por ejemplo: couponUsage/{usageId} = { couponId, userId, orderId, timestamp, ... }
 */
router.get('/:id/usage', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const doc = await db.collection('coupons').doc(id).get();

  if (!doc.exists) {
    throw new ApiError(404, 'Cupón no encontrado');
  }

  // TODO: Implementar tracking de uso en otra colección
  // Por ahora retornamos mensaje informativo
  res.json({
    message: 'Historial de uso del cupón',
    couponId: id,
    usage: [],
    note: 'Funcionalidad de tracking pendiente de implementar. Recomendación: crear colección "couponUsage" para rastrear cada uso.'
  });
}));

export default router;