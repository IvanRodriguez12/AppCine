// functions/src/routes/admin/users.ts
import { Router } from 'express';
import { db, auth } from '../../config/firebase';
import { verifyToken, requireAdmin, AuthRequest } from '../../middleware/auth';
import { asyncHandler, ApiError } from '../../middleware/errorHandler';
import { User, UserRole, AccountStatus, AccountLevel } from '../../models/user';

const router = Router();

// ✅ USAR EL MISMO PATRÓN QUE candyOrders
router.use(verifyToken);
router.use(requireAdmin);

// GET /admin/users
// Listar todos los usuarios con filtros
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const {
    page = 1,
    limit = 20,
    search,
    role,
    accountLevel,
    accountStatus,
    verified,
    hasDni,
    hasFaceVerified
  } = req.query;

  let query: FirebaseFirestore.Query = db.collection('users');

  // ✅ SOLO UN FILTRO DE BÚSQUEDA POR RANGO (displayName)
  if (search) {
    query = query.where('displayName', '>=', search)
                 .where('displayName', '<=', search + '\uf8ff');
  }

  // ✅ FILTROS DE IGUALDAD SIMPLES (máximo 2-3 combinados)
  if (role) {
    query = query.where('role', '==', role);
  }

  if (accountLevel) {
    query = query.where('accountLevel', '==', accountLevel);
  }

  if (accountStatus) {
    query = query.where('accountStatus', '==', accountStatus);
  }

  // ✅ FILTROS SIMPLES (sin verified=true que usa 3 filtros)
  if (hasDni === 'true') {
    query = query.where('dniUploaded', '==', true);
  } else if (hasDni === 'false') {
    query = query.where('dniUploaded', '==', false);
  }

  if (hasFaceVerified === 'true') {
    query = query.where('faceVerified', '==', true);
  } else if (hasFaceVerified === 'false') {
    query = query.where('faceVerified', '==', false);
  }

  // Paginación
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  const snapshot = await query.orderBy('createdAt', 'desc')
                             .limit(limitNum)
                             .offset(offset)
                             .get();

  let users = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as (User & { id: string })[];

  // ✅ FILTRAR verified EN MEMORIA (evita índice complejo)
  if (verified === 'true') {
    users = users.filter(user => 
      user.isEmailVerified && user.dniUploaded && user.faceVerified
    );
  }

  // ✅ Obtener total después del filtrado en memoria
  const total = users.length;

  res.json({
    success: true,
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

// GET /admin/users/stats
// Estadísticas de usuarios
router.get('/stats', asyncHandler(async (req: AuthRequest, res: any) => {
  const snapshot = await db.collection('users').get();
  const users = snapshot.docs.map(doc => doc.data() as User);

  // ✅ Calcular fullyVerified en memoria también
  const fullyVerified = users.filter(u => 
    u.isEmailVerified && u.dniUploaded && u.faceVerified
  ).length;

  const stats = {
    total: users.length,
    byRole: {
      user: users.filter(u => u.role === 'user').length,
      admin: users.filter(u => u.role === 'admin').length,
      moderator: users.filter(u => u.role === 'moderator').length
    },
    byAccountLevel: {
      basic: users.filter(u => u.accountLevel === 'basic').length,
      verified: users.filter(u => u.accountLevel === 'verified').length,
      premium: users.filter(u => u.accountLevel === 'premium').length,
      full: users.filter(u => u.accountLevel === 'full').length
    },
    byAccountStatus: {
      active: users.filter(u => u.accountStatus === 'active').length,
      suspended: users.filter(u => u.accountStatus === 'suspended').length,
      banned: users.filter(u => u.accountStatus === 'banned').length,
      pending: users.filter(u => u.accountStatus === 'pending').length
    },
    verificationStatus: {
      emailVerified: users.filter(u => u.isEmailVerified).length,
      dniUploaded: users.filter(u => u.dniUploaded).length,
      faceVerified: users.filter(u => u.faceVerified).length,
      fullyVerified: fullyVerified // ✅ Usar el calculado en memoria
    },
    premium: {
      premium: users.filter(u => u.isPremium).length,
      nonPremium: users.filter(u => !u.isPremium).length
    },
    favorites: {
      totalFavorites: users.reduce((sum, user) => sum + user.favorites.length, 0),
      usersWithFavorites: users.filter(u => u.favorites.length > 0).length
    }
  };

  res.json({
    success: true,
    stats
  });
}));

// GET /admin/users/:id
// Obtener usuario específico con toda la información
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  // Obtener de Firestore
  const userDoc = await db.collection('users').doc(id).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  // Obtener de Firebase Auth para información adicional
  let authUser;
  try {
    authUser = await auth.getUser(id);
  } catch (error) {
    console.warn('Usuario no encontrado en Firebase Auth:', id);
  }

  const userData = userDoc.data() as User;

  const userWithAuthInfo = {
    id: userDoc.id,
    ...userData,
    authInfo: authUser ? {
      emailVerified: authUser.emailVerified,
      disabled: authUser.disabled,
      lastSignInTime: authUser.metadata.lastSignInTime,
      creationTime: authUser.metadata.creationTime
    } : null
  };

  res.json({
    success: true,
    user: userWithAuthInfo
  });
}));

// PUT /admin/users/:id/status
// Cambiar estado de cuenta
router.put('/:id/status', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { accountStatus, reason } = req.body;

  const validStatuses: AccountStatus[] = ['active', 'suspended', 'banned', 'pending'];
  if (!validStatuses.includes(accountStatus)) {
    throw new ApiError(400, 'Estado de cuenta inválido');
  }

  const userDoc = await db.collection('users').doc(id).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data() as User;

  // Actualizar Firestore
  await db.collection('users').doc(id).update({
    accountStatus,
    updatedAt: new Date().toISOString()
  });

  // Si se suspende o banea, también deshabilitar en Auth
  if (accountStatus === 'suspended' || accountStatus === 'banned') {
    await auth.updateUser(id, {
      disabled: true
    });
  } else {
    // Para active o pending, habilitar en Auth
    await auth.updateUser(id, {
      disabled: false
    });
  }

  // Registrar en historial de moderación
  await db.collection('moderationLogs').add({
    userId: id,
    userEmail: userData.email,
    action: 'account_status_change',
    previousStatus: userData.accountStatus,
    newStatus: accountStatus,
    reason: reason || 'Cambio de estado por administrador',
    adminId: req.user?.uid,
    adminEmail: req.user?.email,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: `Estado de cuenta actualizado a: ${accountStatus}`,
    userId: id,
    newStatus: accountStatus
  });
}));

// PUT /admin/users/:id/role
// Cambiar rol de usuario
router.put('/:id/role', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles: UserRole[] = ['user', 'admin', 'moderator'];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, 'Rol inválido');
  }

  const userDoc = await db.collection('users').doc(id).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data() as User;

  await db.collection('users').doc(id).update({
    role,
    updatedAt: new Date().toISOString()
  });

  // Registrar en historial
  await db.collection('moderationLogs').add({
    userId: id,
    userEmail: userData.email,
    action: 'role_change',
    previousRole: userData.role,
    newRole: role,
    adminId: req.user?.uid,
    adminEmail: req.user?.email,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: `Rol actualizado a: ${role}`,
    userId: id,
    newRole: role
  });
}));

// PUT /admin/users/:id/level
// Cambiar nivel de cuenta
router.put('/:id/level', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { accountLevel } = req.body;

  const validLevels: AccountLevel[] = ['basic', 'verified', 'premium', 'full'];
  if (!validLevels.includes(accountLevel)) {
    throw new ApiError(400, 'Nivel de cuenta inválido');
  }

  const userDoc = await db.collection('users').doc(id).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data() as User;

  await db.collection('users').doc(id).update({
    accountLevel,
    updatedAt: new Date().toISOString()
  });

  // Registrar en historial
  await db.collection('moderationLogs').add({
    userId: id,
    userEmail: userData.email,
    action: 'account_level_change',
    previousLevel: userData.accountLevel,
    newLevel: accountLevel,
    adminId: req.user?.uid,
    adminEmail: req.user?.email,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: `Nivel de cuenta actualizado a: ${accountLevel}`,
    userId: id,
    newLevel: accountLevel
  });
}));

// DELETE /admin/users/:id
// Eliminar usuario permanentemente
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  const userDoc = await db.collection('users').doc(id).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data() as User;

  // Eliminar de Firestore
  await db.collection('users').doc(id).delete();

  // Eliminar de Firebase Auth
  try {
    await auth.deleteUser(id);
  } catch (error) {
    console.warn('Error eliminando usuario de Auth:', error);
  }

  // Registrar en historial
  await db.collection('moderationLogs').add({
    userId: id,
    userEmail: userData.email,
    action: 'permanent_deletion',
    adminId: req.user?.uid,
    adminEmail: req.user?.email,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Usuario eliminado permanentemente',
    userId: id
  });
}));

export default router;