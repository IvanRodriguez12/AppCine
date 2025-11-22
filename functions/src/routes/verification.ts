import { Router } from 'express';
import { db } from '../config/firebase';
import admin from '../config/firebase';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyFace, validateImageForRekognition } from '../services/rekognitionService';
import { User } from '../models/user';
import { ImageValidation } from '../models/common'; 
import {
  VERIFICATION_CONFIG,
  getConfidenceLevel,
  isValidVerificationMimeType,
  generateSelfieFileName,
  scoreToPercentage,
  percentageToScore,
  meetsMinimumThreshold,
  type FaceVerificationRequest,
  type FaceVerificationSuccessResponse,
  type FaceVerificationFailureResponse,
  type VerificationStatusResponse
} from '../models/verification'; 

const router = Router();

// ==================== FUNCIONES DE VALIDACIÓN ====================

/**
 * Valida imagen base64 para verificación facial
 */
const validateImageBase64 = (imageBase64: string, mimeType: string): ImageValidation => {
  // Rekognition solo soporta JPEG y PNG
  if (!isValidVerificationMimeType(mimeType)) {
    return { 
      valid: false, 
      error: 'Formato inválido. Solo JPEG y PNG son soportados por Rekognition' 
    };
  }

  if (!imageBase64 || imageBase64.length === 0) {
    return { valid: false, error: 'La imagen está vacía' };
  }

  const sizeInBytes = (imageBase64.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (sizeInMB > VERIFICATION_CONFIG.MAX_SIZE_MB) {
    return { 
      valid: false, 
      error: `Imagen demasiado grande (${sizeInMB.toFixed(2)}MB). Máximo: ${VERIFICATION_CONFIG.MAX_SIZE_MB}MB` 
    };
  }

  return { valid: true };
};

// ==================== ENDPOINTS ====================

/**
 * POST /verification/face
 * Verifica el rostro del usuario usando AWS Rekognition
 */
router.post('/face', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const userId = req.user?.uid;
  const { imageBase64, mimeType }: FaceVerificationRequest = req.body;

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

  const userData = userDoc.data() as User;

  // Verificar que tenga DNI subido
  if (!userData?.dniUploaded || !userData?.dniUrl) {
    throw new ApiError(400, 'Debes subir tu DNI antes de verificar tu rostro');
  }

  // Verificar que no esté ya verificado
  if (userData?.faceVerified) {
    const similarity = userData?.faceVerificationScore 
      ? scoreToPercentage(userData.faceVerificationScore)
      : null;

    return res.json({
      message: 'El rostro ya está verificado',
      alreadyVerified: true,
      verifiedAt: userData?.faceVerifiedAt,
      similarity
    });
  }

  // Convertir selfie base64 a buffer
  const selfieBuffer = Buffer.from(imageBase64, 'base64');

  // Validar selfie para Rekognition
  const selfieValidation = validateImageForRekognition(selfieBuffer);
  if (!selfieValidation.valid) {
    throw new ApiError(400, selfieValidation.error || 'Selfie inválida');
  }

  // Obtener bucket de Storage
  const bucket = admin.storage().bucket();
  
  // Generar nombre único para la selfie
  const fileName = generateSelfieFileName(userId, mimeType);
  const file = bucket.file(fileName);

  // Subir selfie a Storage (privado)
  await file.save(selfieBuffer, {
    metadata: {
      contentType: mimeType,
      metadata: {
        userId: userId,
        uploadedAt: new Date().toISOString()
      }
    },
    public: false,
  });

  // Obtener URL firmada
  const expiryTime = Date.now() + (VERIFICATION_CONFIG.SIGNED_URL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const [selfieUrl] = await file.getSignedUrl({
    action: 'read',
    expires: expiryTime,
  });

  console.log('=== 🔍 VERIFICACIÓN FACIAL CON AWS REKOGNITION ===');
  console.log('👤 Usuario:', userId);
  console.log('📸 Selfie subida:', fileName);

  try {
    // Leer DNI directamente desde Storage
    console.log('⬇️  Leyendo DNI desde Storage...');
    
    const dniFile = bucket.file(userData.dniFileName!);
    const [dniBuffer] = await dniFile.download();
    
    console.log('✅ DNI leído:', dniBuffer.length, 'bytes');

    // Validar DNI
    const dniValidation = validateImageForRekognition(dniBuffer);
    if (!dniValidation.valid) {
      throw new ApiError(400, `DNI inválido: ${dniValidation.error}`);
    }

    // ========== VERIFICACIÓN CON AWS REKOGNITION ==========
    console.log('🚀 Iniciando verificación facial con AWS Rekognition...');
    const verificationResult = await verifyFace(selfieBuffer, dniBuffer);

    console.log('✅ Resultado:', verificationResult.verified ? '✅ VERIFICADO' : '❌ NO VERIFICADO');
    console.log('📊 Similitud:', verificationResult.similarity + '%');
    console.log('🎯 Umbral mínimo:', VERIFICATION_CONFIG.MIN_SIMILARITY_THRESHOLD + '%');
    console.log('📈 Nivel de confianza:', getConfidenceLevel(verificationResult.similarity));
    console.log('===============================================');

    if (!verificationResult.success) {
      throw new ApiError(500, verificationResult.message);
    }

    // Calcular score normalizado (0-1)
    const score = percentageToScore(verificationResult.similarity);

    // Actualizar Firestore
    const updateData: any = {
      selfieUrl,
      selfieFileName: fileName,
      faceVerificationScore: score,
      faceVerificationAttemptAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (verificationResult.verified && meetsMinimumThreshold(verificationResult.similarity)) {
      updateData.faceVerified = true;
      updateData.faceVerifiedAt = new Date().toISOString();
      updateData.accountLevel = 'premium';
      updateData.lastVerificationError = null;
    } else {
      updateData.lastVerificationError = verificationResult.message;
    }

    await db.collection('users').doc(userId).update(updateData);

    // Respuesta al cliente
    if (verificationResult.verified) {
      const successResponse: FaceVerificationSuccessResponse = {
        message: verificationResult.message,
        verified: true,
        similarity: verificationResult.similarity,
        selfieUrl,
        details: verificationResult.details
      };
      
      res.json(successResponse);
    } else {
      const failureResponse: FaceVerificationFailureResponse = {
        error: 'Verificación facial fallida',
        message: verificationResult.message,
        verified: false,
        similarity: verificationResult.similarity,
        details: verificationResult.details
      };
      
      res.status(400).json(failureResponse);
    }

  } catch (error: any) {
    console.error('❌ Error en verificación facial:', error);

    // Registrar intento fallido
    await db.collection('users').doc(userId).update({
      faceVerificationAttemptAt: new Date().toISOString(),
      lastVerificationError: error.message,
      updatedAt: new Date().toISOString()
    });

    throw new ApiError(
      500, 
      error.message || 'Error al verificar rostro con AWS Rekognition'
    );
  }
}));

/**
 * GET /verification/status
 * Obtiene el estado completo de verificación
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

  const userData = userDoc.data() as User;

  // Convertir score a porcentaje si existe
  const similarity = userData?.faceVerificationScore 
    ? scoreToPercentage(userData.faceVerificationScore)
    : null;

  const response: VerificationStatusResponse = {
    userId: userId,
    email: userData?.email || '',
    accountLevel: userData?.accountLevel || 'basic',
    accountStatus: userData?.accountStatus || 'active',
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
        similarity,
        lastAttemptAt: userData?.faceVerificationAttemptAt || null,
        lastError: userData?.lastVerificationError || null
      }
    }
  };

  res.json(response);
}));

/**
 * DELETE /verification/face
 * Elimina la verificación facial
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

  const userData = userDoc.data() as User;

  if (!userData?.faceVerified && !userData?.selfieUrl) {
    throw new ApiError(400, 'No hay verificación facial para eliminar');
  }

  // Eliminar selfie de Storage
  if (userData?.selfieFileName) {
    try {
      const bucket = admin.storage().bucket();
      await bucket.file(userData.selfieFileName).delete();
      console.log('🗑️  Selfie eliminada:', userData.selfieFileName);
    } catch (error) {
      console.error('Error eliminando selfie:', error);
      // No lanzar error, continuar con la limpieza de Firestore
    }
  }

  // Determinar nuevo accountLevel
  const newAccountLevel = userData?.isEmailVerified ? 'verified' : 'basic';

  // Limpiar datos de verificación facial
  await db.collection('users').doc(userId).update({
    selfieUrl: null,
    selfieFileName: null,
    faceVerified: false,
    faceVerificationScore: null,
    faceVerifiedAt: null,
    lastVerificationError: null,
    accountLevel: newAccountLevel,
    updatedAt: new Date().toISOString()
  });

  res.json({
    message: 'Verificación facial eliminada. Puedes intentar de nuevo.',
    accountLevel: newAccountLevel
  });
}));

export default router;