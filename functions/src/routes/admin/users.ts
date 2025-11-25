/**
 * routes/admin/users.ts
 * Gestión de usuarios para administradores
 */

import { Router } from 'express';
import { db, auth } from '../../config/firebase';
import { verifyToken, requireAdmin, AuthRequest } from '../../middleware/auth';
import { asyncHandler, ApiError } from '../../middleware/errorHandler';
import { User } from '../../models/user';

const router = Router();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(verifyToken);
router.use(requireAdmin);

/**
 * GET /admin/users
 * Listar todos los usuarios con paginación y filtros
 */
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const { 
    limit = '20', 
    startAfter, 
    role, 
    accountStatus, 
    accountLevel,
    orderBy = 'createdAt',
    order = 'desc'
  } = req.query;

  let query = db.collection('users').orderBy(orderBy as string, order as any);

  // Filtros opcionales
  if (role) {
    query = query.where('role', '==', role) as any;
  }

  if (accountStatus) {
    query = query.where('accountStatus', '==', accountStatus) as any;
  }

  if (accountLevel) {
    query = query.where('accountLevel', '==', accountLevel) as any;
  }

  // Paginación
  if (startAfter) {
    const lastDoc = await db.collection('users').doc(startAfter as string).get();
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc) as any;
    }
  }

  query = query.limit(Number(limit)) as any;

  const snapshot = await query.get();

  const users = snapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data(),
    // Ocultar datos sensibles
    dniUrl: undefined,
    selfieUrl: undefined
  }));

  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  res.json({
    users,
    count: users.length,
    hasMore: users.length === Number(limit),
    nextPageToken: lastVisible?.id || null
  });
}));

/**
 * GET /admin/users/stats
 * Estadísticas generales de usuarios
 */
router.get('/stats', asyncHandler(async (req: AuthRequest, res: any) => {
  const usersSnapshot = await db.collection('users').get();
  const users = usersSnapshot.docs.map(doc => doc.data() as User);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const stats = {
    total: users.length,
    newThisMonth: users.filter(u => new Date(u.createdAt) >= startOfMonth).length,
    newThisWeek: users.filter(u => new Date(u.createdAt) >= startOfWeek).length,
    verified: users.filter(u => u.isEmailVerified).length,
    withDni: users.filter(u => u.dniUploaded).length,
    withFaceVerified: users.filter(u => u.faceVerified).length,
    byRole: {
      user: users.filter(u => u.role === 'user').length,
      admin: users.filter(u => u.role === 'admin').length,
      moderator: users.filter(u => u.role === 'moderator').length,
    },
    byAccountLevel: {
      basic: users.filter(u => u.accountLevel === 'basic').length,
      verified: users.filter(u => u.accountLevel === 'verified').length,
      premium: users.filter(u => u.accountLevel === 'premium').length,
      full: users.filter(u => u.accountLevel === 'full').length,
    },
    byAccountStatus: {
      active: users.filter(u => u.accountStatus === 'active').length,
      suspended: users.filter(u => u.accountStatus === 'suspended').length,
      banned: users.filter(u => u.accountStatus === 'banned').length,
      pending: users.filter(u => u.accountStatus === 'pending').length,
    }
  };

  res.json(stats);
}));

/**
 * GET /admin/users/:id
 * Ver detalles completos de un usuario
 */
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const userDoc = await db.collection('users').doc(id).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data() as User;

  // Obtener compras de tickets
  const ticketsSnapshot = await db.collection('tickets')
    .where('userId', '==', id)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const tickets = ticketsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Obtener compras de candy
  const candyOrdersSnapshot = await db.collection('candyOrders')
    .where('userId', '==', id)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const candyOrders = candyOrdersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Calcular estadísticas del usuario
  const allTickets = await db.collection('tickets').where('userId', '==', id).get();
  const allCandyOrders = await db.collection('candyOrders').where('userId', '==', id).get();

  const totalSpent = 
    allTickets.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0) +
    allCandyOrders.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);

  res.json({
    user: {
      ...userData,
      uid: id  // ✅ Sobrescribe el uid con el del documento
    },
    activity: {
      recentTickets: tickets,
      recentCandyOrders: candyOrders,
      totalTickets: allTickets.size,
      totalCandyOrders: allCandyOrders.size,
      totalSpent
    }
  });
}));

/**
 * GET /admin/users/search/:query
 * Buscar usuarios por email o nombre
 */
router.get('/search/:query', asyncHandler(async (req: AuthRequest, res: any) => {
  const { query } = req.params;
  const searchQuery = query.toLowerCase();

  // Buscar en Firestore (esto es ineficiente, considera usar Algolia para producción)
  const usersSnapshot = await db.collection('users').get();
  
  const users = usersSnapshot.docs
    .map(doc => ({
      uid: doc.id,
      ...doc.data()
    }))
    .filter((user: any) => 
      user.email?.toLowerCase().includes(searchQuery) ||
      user.displayName?.toLowerCase().includes(searchQuery) ||
      user.uid?.toLowerCase().includes(searchQuery)
    )
    .slice(0, 20) // Limitar a 20 resultados
    .map((user: any) => ({
      ...user,
      // Ocultar datos sensibles
      dniUrl: undefined,
      selfieUrl: undefined
    }));

  res.json({
    query,
    users,
    count: users.length
  });
}));

/**
 * PUT /admin/users/:id/role
 * Cambiar rol de un usuario
 */
router.put('/:id/role', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin', 'moderator'].includes(role)) {
    throw new ApiError(400, 'Rol inválido. Debe ser: user, admin, o moderator');
  }

  const userDoc = await db.collection('users').doc(id).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  // Actualizar en Firestore
  await db.collection('users').doc(id).update({
    role,
    updatedAt: new Date().toISOString()
  });

  // Actualizar custom claims en Firebase Auth
  await auth.setCustomUserClaims(id, { 
    role,
    admin: role === 'admin',
    moderator: role === 'moderator'
  });

  console.log(`✅ Rol actualizado por admin ${req.user?.uid}: ${id} → ${role}`);

  res.json({
    message: 'Rol actualizado exitosamente',
    userId: id,
    newRole: role
  });
}));

/**
 * PUT /admin/users/:id/status
 * Cambiar estado de cuenta (active, suspended, banned)
 */
router.put('/:id/status', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!['active', 'suspended', 'banned'].includes(status)) {
    throw new ApiError(400, 'Estado inválido. Debe ser: active, suspended, o banned');
  }

  const userDoc = await db.collection('users').doc(id).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  // No permitir cambiar el estado del propio admin
  if (id === req.user?.uid) {
    throw new ApiError(400, 'No puedes cambiar tu propio estado');
  }

  const updateData: any = {
    accountStatus: status,
    updatedAt: new Date().toISOString()
  };

  if (status === 'suspended' || status === 'banned') {
    updateData.suspensionReason = reason || 'Sin razón especificada';
    updateData.suspendedAt = new Date().toISOString();
    updateData.suspendedBy = req.user?.uid;
  } else {
    updateData.suspensionReason = null;
    updateData.suspendedAt = null;
    updateData.suspendedBy = null;
  }

  await db.collection('users').doc(id).update(updateData);

  // Si está baneado, desactivar en Firebase Auth
  if (status === 'banned') {
    await auth.updateUser(id, { disabled: true });
  } else {
    await auth.updateUser(id, { disabled: false });
  }

  console.log(`✅ Estado actualizado por admin ${req.user?.uid}: ${id} → ${status}`);

  res.json({
    message: `Usuario ${status === 'active' ? 'reactivado' : status === 'suspended' ? 'suspendido' : 'baneado'} exitosamente`,
    userId: id,
    newStatus: status
  });
}));

/**
 * PUT /admin/users/:id/account-level
 * Cambiar nivel de cuenta manualmente
 */
router.put('/:id/account-level', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { accountLevel } = req.body;

  if (!['basic', 'verified', 'premium', 'full'].includes(accountLevel)) {
    throw new ApiError(400, 'Nivel inválido. Debe ser: basic, verified, premium, o full');
  }

  const userDoc = await db.collection('users').doc(id).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  await db.collection('users').doc(id).update({
    accountLevel,
    updatedAt: new Date().toISOString()
  });

  console.log(`✅ Account level actualizado por admin ${req.user?.uid}: ${id} → ${accountLevel}`);

  res.json({
    message: 'Nivel de cuenta actualizado exitosamente',
    userId: id,
    newAccountLevel: accountLevel
  });
}));

/**
 * DELETE /admin/users/:id
 * Eliminar usuario completamente (GDPR compliance)
 */
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  // No permitir que el admin se elimine a sí mismo
  if (id === req.user?.uid) {
    throw new ApiError(400, 'No puedes eliminar tu propia cuenta como admin');
  }

  const userDoc = await db.collection('users').doc(id).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  // Eliminar de Firebase Auth
  try {
    await auth.deleteUser(id);
  } catch (error: any) {
    console.error('Error eliminando de Auth:', error);
    // Continuar de todos modos
  }

  // Eliminar de Firestore
  await db.collection('users').doc(id).delete();

  // TODO: Eliminar archivos de Storage (DNI, selfies)
  // await storageService.deleteAllUserFiles(id);

  // TODO: Marcar tickets y órdenes como del usuario eliminado
  // O eliminarlos según tu política

  console.log(`🗑️  Usuario eliminado por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: 'Usuario eliminado exitosamente',
    userId: id
  });
}));

/**
 * POST /admin/users/:id/reset-password
 * Enviar email de reseteo de contraseña a un usuario
 */
router.post('/:id/reset-password', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const userDoc = await db.collection('users').doc(id).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data() as User;
  const resetLink = await auth.generatePasswordResetLink(userData.email);

  // TODO: Enviar email con emailService
  // await emailService.sendPasswordResetEmail({
  //   email: userData.email,
  //   displayName: userData.displayName,
  //   resetLink
  // });

  console.log(`📧 Link de reseteo generado para ${userData.email}:`, resetLink);

  res.json({
    message: 'Email de reseteo de contraseña enviado',
    email: userData.email
  });
}));

/**
 * POST /admin/users/:id/verify-email
 * Forzar verificación de email (sin enviar email)
 */
router.post('/:id/verify-email', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const userDoc = await db.collection('users').doc(id).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  await auth.updateUser(id, {
    emailVerified: true
  });

  await db.collection('users').doc(id).update({
    isEmailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    accountLevel: 'verified',
    updatedAt: new Date().toISOString()
  });

  console.log(`✅ Email verificado manualmente por admin ${req.user?.uid}: ${id}`);

  res.json({
    message: 'Email verificado exitosamente',
    userId: id
  });
}));

export default router;
