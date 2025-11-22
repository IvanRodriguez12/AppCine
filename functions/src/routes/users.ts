import { Router } from 'express';
import { db, auth } from '../config/firebase';
import admin from '../config/firebase'; 
import { verifyToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { createUserInitialData, User, PublicUserProfile, toPublicProfile } from '../models/user';

const router = Router();

// ==================== FUNCIONES DE VALIDACIÓN ====================

/**
 * Valida la fortaleza de la contraseña
 */
const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La contraseña debe contener al menos un caracter especial (!@#$%^&*...)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Valida que el usuario sea mayor de 18 años
 */
const validateAge = (birthDate: string): { valid: boolean; age: number; error?: string } => {
  if (!birthDate) {
    return { valid: false, age: 0, error: 'La fecha de nacimiento es requerida' };
  }

  let date: Date;
  
  if (birthDate.includes('-')) {
    date = new Date(birthDate);
  } else if (birthDate.includes('/')) {
    const [day, month, year] = birthDate.split('/');
    date = new Date(`${year}-${month}-${day}`);
  } else {
    return { valid: false, age: 0, error: 'Formato de fecha inválido. Use YYYY-MM-DD o DD/MM/YYYY' };
  }

  if (isNaN(date.getTime())) {
    return { valid: false, age: 0, error: 'Fecha de nacimiento inválida' };
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }

  if (age < 0) {
    return { valid: false, age: 0, error: 'Fecha de nacimiento no puede estar en el futuro' };
  }

  if (age < 18) {
    return { valid: false, age, error: 'Debes ser mayor de 18 años para registrarte' };
  }

  if (age > 120) {
    return { valid: false, age, error: 'Fecha de nacimiento inválida' };
  }

  return { valid: true, age };
};

/**
 * Valida el formato del email
 */
const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Formato de email inválido' };
  }

  return { valid: true };
};

/**
 * Valida el teléfono
 */
const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,20}$/;
  
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'Formato de teléfono inválido' };
  }

  return { valid: true };
};

// ==================== REGISTRO ====================

/**
 * POST /users/register
 * Registro de nuevo usuario
 */
router.post('/register', asyncHandler(async (req: any, res: any) => {
  const { email, password, displayName, birthDate, phone, acceptTerms } = req.body;

  if (!email || !password || !displayName || !birthDate) {
    throw new ApiError(400, 'Email, contraseña, nombre y fecha de nacimiento son requeridos');
  }

  if (!acceptTerms) {
    throw new ApiError(400, 'Debes aceptar los términos y condiciones');
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    throw new ApiError(400, emailValidation.error || 'Email inválido');
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new ApiError(400, passwordValidation.errors.join('. '));
  }

  const ageValidation = validateAge(birthDate);
  if (!ageValidation.valid) {
    throw new ApiError(400, ageValidation.error || 'Edad inválida');
  }

  if (phone) {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      throw new ApiError(400, phoneValidation.error || 'Teléfono inválido');
    }
  }

  // Crear usuario en Firebase Auth
  const userRecord = await auth.createUser({
    email,
    password,
    displayName,
    emailVerified: false
  });

  // Crear documento en Firestore usando el modelo
  const userData = createUserInitialData(email, displayName, birthDate, ageValidation.age, phone);
  
  await db.collection('users').doc(userRecord.uid).set(userData);

  const customToken = await auth.createCustomToken(userRecord.uid);

  res.status(201).json({
    message: 'Usuario creado exitosamente',
    user: {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      age: ageValidation.age,
      role: userData.role,
      accountLevel: userData.accountLevel,
      isEmailVerified: false,
      dniUploaded: false,
      faceVerified: false
    },
    customToken
  });
}));

// ==================== LOGIN ====================

/**
 * POST /users/login
 * Login de usuario
 */
router.post('/login', asyncHandler(async (req: any, res: any) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email y contraseña son requeridos');
  }

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (error) {
    throw new ApiError(401, 'Credenciales inválidas');
  }

  const userDoc = await db.collection('users').doc(userRecord.uid).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data() as User;

  if (userData?.accountStatus === 'suspended') {
    throw new ApiError(403, 'Tu cuenta ha sido suspendida. Contacta al soporte.');
  }

  if (userData?.accountStatus === 'banned') {
    throw new ApiError(403, 'Tu cuenta ha sido bloqueada permanentemente.');
  }

  await db.collection('users').doc(userRecord.uid).update({
    lastLoginAt: new Date().toISOString()
  });

  const customToken = await auth.createCustomToken(userRecord.uid);

  res.json({
    message: 'Login exitoso',
    customToken,
    user: {
      uid: userRecord.uid,
      email: userData?.email,
      displayName: userData?.displayName,
      role: userData?.role,
      accountLevel: userData?.accountLevel,
      isEmailVerified: userData?.isEmailVerified,
      dniUploaded: userData?.dniUploaded,
      faceVerified: userData?.faceVerified
    }
  });
}));

// ==================== VERIFICACIÓN DE EMAIL ====================

/**
 * POST /users/send-verification-email
 * Envía email de verificación
 */
router.post('/send-verification-email', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const userId = req.user?.uid;

  if (!userId) {
    throw new ApiError(401, 'Usuario no autenticado');
  }

  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data() as User;

  if (userData?.isEmailVerified) {
    return res.json({
      message: 'El email ya está verificado',
      alreadyVerified: true
    });
  }

  const email = userData?.email;
  const verificationLink = await auth.generateEmailVerificationLink(email);

  await db.collection('users').doc(userId).update({
    emailVerificationSentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  console.log('=== LINK DE VERIFICACIÓN ===');
  console.log(verificationLink);
  console.log('===========================');

  res.json({
    message: 'Email de verificación enviado exitosamente',
    sentTo: email
  });
}));

/**
 * POST /users/verify-email
 * Verifica el email del usuario
 */
router.post('/verify-email', asyncHandler(async (req: any, res: any) => {
  const { oobCode } = req.body;

  if (!oobCode) {
    throw new ApiError(400, 'Código de verificación es requerido');
  }

  try {
    const [email] = oobCode.split(':');
    
    if (!email) {
      throw new ApiError(400, 'Código de verificación inválido');
    }

    const userRecord = await auth.getUserByEmail(email);

    await auth.updateUser(userRecord.uid, {
      emailVerified: true
    });

    await db.collection('users').doc(userRecord.uid).update({
      isEmailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      accountLevel: 'verified',
      updatedAt: new Date().toISOString()
    });

    res.json({
      message: 'Email verificado exitosamente',
      verified: true,
      accountLevel: 'verified'
    });

  } catch (error: any) {
    console.error('Error verificando email:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new ApiError(404, 'Usuario no encontrado');
    }
    
    if (error.code === 'auth/invalid-action-code') {
      throw new ApiError(400, 'Código de verificación inválido o expirado');
    }

    throw new ApiError(500, 'Error al verificar email');
  }
}));

// ==================== RECUPERAR CONTRASEÑA ====================

/**
 * POST /users/forgot-password
 * Envía email para recuperar contraseña
 */
router.post('/forgot-password', asyncHandler(async (req: any, res: any) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email es requerido');
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    throw new ApiError(400, emailValidation.error || 'Email inválido');
  }

  try {
    await auth.getUserByEmail(email);
  } catch (error: any) {
    return res.json({
      message: 'Si el email existe, recibirás un link para restablecer tu contraseña',
      sentTo: email
    });
  }

  const resetLink = await auth.generatePasswordResetLink(email);

  console.log('=== 🔑 LINK DE RESETEO DE CONTRASEÑA ===');
  console.log('Email:', email);
  console.log('Link:', resetLink);
  console.log('=======================================');

  res.json({
    message: 'Si el email existe, recibirás un link para restablecer tu contraseña',
    sentTo: email,
  });
}));

/**
 * POST /users/reset-password
 * Resetea la contraseña con el código de verificación
 */
router.post('/reset-password', asyncHandler(async (req: any, res: any) => {
  const { oobCode, newPassword } = req.body;

  if (!oobCode || !newPassword) {
    throw new ApiError(400, 'Código de verificación y nueva contraseña son requeridos');
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new ApiError(400, passwordValidation.errors.join('. '));
  }

  try {
    const [email] = oobCode.split(':');
    
    if (!email) {
      throw new ApiError(400, 'Código de verificación inválido');
    }

    const userRecord = await auth.getUserByEmail(email);

    await auth.updateUser(userRecord.uid, {
      password: newPassword
    });

    await db.collection('users').doc(userRecord.uid).update({
      passwordChangedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Contraseña actualizada para:', email);

    res.json({
      message: 'Contraseña actualizada exitosamente',
      success: true
    });

  } catch (error: any) {
    console.error('Error reseteando contraseña:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new ApiError(404, 'Usuario no encontrado');
    }
    
    if (error.code === 'auth/invalid-action-code') {
      throw new ApiError(400, 'Código de verificación inválido o expirado');
    }

    throw new ApiError(500, 'Error al restablecer contraseña');
  }
}));

/**
 * POST /users/change-password
 * Cambia la contraseña (usuario autenticado)
 */
router.post('/change-password', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const userId = req.user?.uid;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    throw new ApiError(401, 'Usuario no autenticado');
  }

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Contraseña actual y nueva contraseña son requeridas');
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new ApiError(400, passwordValidation.errors.join('. '));
  }

  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data() as User;
  const email = userData?.email;

  try {
    await auth.getUserByEmail(email);
  } catch (error) {
    throw new ApiError(401, 'Contraseña actual incorrecta');
  }

  await auth.updateUser(userId, {
    password: newPassword
  });

  await db.collection('users').doc(userId).update({
    passwordChangedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  console.log('✅ Contraseña cambiada para:', email);

  res.json({
    message: 'Contraseña actualizada exitosamente',
    success: true
  });
}));

// ==================== PERFIL ====================

/**
 * GET /users/:id
 * Obtener perfil de usuario
 */
router.get('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  if (req.user?.uid !== id && req.user?.role !== 'admin') {
    throw new ApiError(403, 'No autorizado para ver este perfil');
  }

  const userDoc = await db.collection('users').doc(id).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data();  // ← SIN "as User"

  if (req.user?.uid === id || req.user?.role === 'admin') {
    res.json({
      uid: userDoc.id,
      ...userData,
      password: undefined
    });
  } else {
    // Construir User completo con uid
    const fullUserData = {
      uid: userDoc.id,
      ...userData
    };
    
    const publicProfile = toPublicProfile(fullUserData.uid, fullUserData);
    res.json(publicProfile);
  }
}));

/**
 * PUT /users/:id
 * Actualizar perfil de usuario
 */
router.put('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { displayName, photoURL, bio, phone } = req.body;

  if (req.user?.uid !== id) {
    throw new ApiError(403, 'No autorizado para actualizar este perfil');
  }

  const updateData: any = {
    updatedAt: new Date().toISOString()
  };

  if (displayName) updateData.displayName = displayName;
  if (photoURL) updateData.photoURL = photoURL;
  if (bio) updateData.bio = bio;
  
  if (phone) {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      throw new ApiError(400, phoneValidation.error || 'Teléfono inválido');
    }
    updateData.phone = phone;
  }

  await db.collection('users').doc(id).update(updateData);

  if (displayName || photoURL) {
    const authUpdate: any = {};
    if (displayName) authUpdate.displayName = displayName;
    if (photoURL) authUpdate.photoURL = photoURL;
    
    await auth.updateUser(id, authUpdate);
  }

  res.json({
    message: 'Perfil actualizado exitosamente',
    data: updateData
  });
}));

// ==================== FAVORITOS ====================

/**
 * GET /users/:id/favorites
 * Obtener películas favoritas
 */
router.get('/:id/favorites', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;

  if (req.user?.uid !== id && req.user?.role !== 'admin') {
    throw new ApiError(403, 'No autorizado');
  }

  const userDoc = await db.collection('users').doc(id).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const favorites = userDoc.data()?.favorites || [];

  res.json({
    userId: id,
    favorites,
    count: favorites.length
  });
}));

/**
 * POST /users/:id/favorites
 * Agregar película a favoritos
 */
router.post('/:id/favorites', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { movieId } = req.body;

  if (!movieId) {
    throw new ApiError(400, 'movieId es requerido');
  }

  if (req.user?.uid !== id) {
    throw new ApiError(403, 'No autorizado');
  }

  await db.collection('users').doc(id).update({
    favorites: admin.firestore.FieldValue.arrayUnion(movieId),
    updatedAt: new Date().toISOString()
  });

  res.json({
    message: 'Película agregada a favoritos',
    movieId
  });
}));

/**
 * DELETE /users/:id/favorites/:movieId
 * Quitar película de favoritos
 */
router.delete('/:id/favorites/:movieId', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const { id, movieId } = req.params;

  if (req.user?.uid !== id) {
    throw new ApiError(403, 'No autorizado');
  }

  await db.collection('users').doc(id).update({
    favorites: admin.firestore.FieldValue.arrayRemove(Number(movieId)),
    updatedAt: new Date().toISOString()
  });

  res.json({
    message: 'Película quitada de favoritos',
    movieId
  });
}));

export default router;