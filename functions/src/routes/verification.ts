import { Router } from 'express';
import { db } from '../config/firebase';
import admin from '../config/firebase';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

const router = Router();

// ==================== FUNCIONES DE VALIDACIÓN ====================

/**
 * Valida imagen base64
 */
const validateImageBase64 = (imageBase64: string, mimeType: string): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(mimeType.toLowerCase())) {
    return { 
      valid: false, 
      error: 'Formato de imagen no válido. Solo se permiten: JPEG, PNG, WEBP' 
    };
  }

  if (!imageBase64 || imageBase64.length === 0) {
    return { valid: false, error: 'La imagen está vacía' };
  }

  const sizeInBytes = (imageBase64.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (sizeInMB > 5) {
    return { 
      valid: false, 
      error: `Imagen demasiado grande (${sizeInMB.toFixed(2)}MB). Máximo: 5MB` 
    };
  }

  return { valid: true };
};

/**
 * Simula verificación facial
 * En producción, aquí integrarías un servicio real como:
 * - AWS Rekognition
 * - Google Cloud Vision API
 * - Azure Face API
 * - Face++
 */
const simulateFaceVerification = async (): Promise<{ match: boolean; score: number }> => {
  // Simular tiempo de procesamiento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generar score aleatorio entre 85-98%
  const score = Math.random() * 0.13 + 0.85;
  const match = score >= 0.85;
  
  return { match, score };
};

// ==================== ENDPOINTS ====================

/**
 * POST /verification/face
 * Verifica el rostro del usuario comparándolo con su DNI
 */
router.post('/face', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const userId = req.user?.uid;
  const { imageBase64, mimeType } = req.body;

  if (!userId) {
    throw new ApiError(401, 'Usuario no autenticado');
  }

  if (!imageBase64 || !mimeType) {
    throw new ApiError(400, 'Imagen y tipo MIME son requeridos');
  }

  // Validar imagen
  const imageValidation = validateImageBase64(imageBase64, mimeType);
  if (!imageValidation.valid) {
    throw new ApiError(400, imageValidation.error || 'Imagen inválida');
  }

  // Obtener usuario
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data();

  // Verificar que tenga DNI subido
  if (!userData?.dniUploaded) {
    throw new ApiError(400, 'Debes subir tu DNI antes de verificar tu rostro');
  }

  // Verificar que no esté ya verificado
  if (userData?.faceVerified) {
    return res.json({
      message: 'El rostro ya está verificado',
      alreadyVerified: true,
      verifiedAt: userData?.faceVerifiedAt,
      score: userData?.faceVerificationScore
    });
  }

  // Obtener bucket de Storage
  const bucket = admin.storage().bucket();
  
  // Crear nombre único para la selfie
  const fileExtension = mimeType.split('/')[1];
  const fileName = `selfies/${userId}_${Date.now()}.${fileExtension}`;
  const file = bucket.file(fileName);

  // Convertir base64 a buffer
  const buffer = Buffer.from(imageBase64, 'base64');

  // Subir selfie a Storage
  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      metadata: {
        userId: userId,
        uploadedAt: new Date().toISOString()
      }
    },
    public: false,
  });

  // Obtener URL firmada (válida por 7 días)
  const [selfieUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  // ========== VERIFICACIÓN FACIAL ==========
  // AQUÍ INTEGRARÍAS UN SERVICIO REAL DE RECONOCIMIENTO FACIAL
  // Por ahora, usamos simulación
  
  console.log('=== VERIFICACIÓN FACIAL ===');
  console.log('DNI URL:', userData?.dniUrl);
  console.log('Selfie URL:', selfieUrl);
  console.log('Simulando comparación...');
  
  const { match, score } = await simulateFaceVerification();
  
  console.log('Resultado:', match ? 'MATCH ✅' : 'NO MATCH ❌');
  console.log('Score:', (score * 100).toFixed(2) + '%');
  console.log('==========================');

  // Actualizar Firestore
  const updateData: any = {
    selfieUrl,
    selfieFileName: fileName,
    faceVerificationScore: score,
    faceVerificationAttemptAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (match) {
    updateData.faceVerified = true;
    updateData.faceVerifiedAt = new Date().toISOString();
  }

  await db.collection('users').doc(userId).update(updateData);

  if (match) {
    res.json({
      message: 'Verificación facial exitosa',
      verified: true,
      score: parseFloat((score * 100).toFixed(2)),
      selfieUrl
    });
  } else {
    res.status(400).json({
      error: 'Verificación facial fallida',
      message: 'El rostro no coincide con el documento. Por favor, intenta de nuevo.',
      verified: false,
      score: parseFloat((score * 100).toFixed(2))
    });
  }
}));

/**
 * GET /verification/status
 * Obtiene el estado completo de verificación del usuario autenticado
 */
router.get('/status', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const userId = req.user?.uid;

  if (!userId) {
    throw new ApiError(401, 'Usuario no autenticado');
  }

  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data();

  res.json({
    userId: userId,
    email: userData?.email,
    accountLevel: userData?.accountLevel,
    accountStatus: userData?.accountStatus,
    verificationStatus: {
      email: {
        verified: userData?.isEmailVerified || false,
        verifiedAt: userData?.emailVerifiedAt || null
      },
      dni: {
        uploaded: userData?.dniUploaded || false,
        uploadedAt: userData?.dniUploadedAt || null,
        url: userData?.dniUrl || null
      },
      face: {
        verified: userData?.faceVerified || false,
        verifiedAt: userData?.faceVerifiedAt || null,
        score: userData?.faceVerificationScore 
          ? parseFloat((userData.faceVerificationScore * 100).toFixed(2))
          : null,
        lastAttemptAt: userData?.faceVerificationAttemptAt || null
      }
    }
  });
}));

/**
 * DELETE /verification/face
 * Elimina la verificación facial (permite re-intentar)
 */
router.delete('/face', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const userId = req.user?.uid;

  if (!userId) {
    throw new ApiError(401, 'Usuario no autenticado');
  }

  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data();

  if (!userData?.faceVerified && !userData?.selfieUrl) {
    throw new ApiError(400, 'No hay verificación facial para eliminar');
  }

  // Eliminar selfie de Storage si existe
  if (userData?.selfieFileName) {
    try {
      const bucket = admin.storage().bucket();
      await bucket.file(userData.selfieFileName).delete();
    } catch (error) {
      console.error('Error eliminando selfie de Storage:', error);
    }
  }

  // Limpiar datos en Firestore
  await db.collection('users').doc(userId).update({
    selfieUrl: null,
    selfieFileName: null,
    faceVerified: false,
    faceVerificationScore: null,
    faceVerifiedAt: null,
    updatedAt: new Date().toISOString()
  });

  res.json({
    message: 'Verificación facial eliminada. Puedes intentar de nuevo.'
  });
}));

export default router;