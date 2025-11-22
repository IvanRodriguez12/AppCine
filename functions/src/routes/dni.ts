import { Router } from 'express';
import { db } from '../config/firebase';
import admin from '../config/firebase';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { ImageValidation } from '../models/common'; 
import { 
  DNI_CONFIG, 
  getBase64SizeInMB, 
  isValidDNIMimeType, 
  generateDNIFileName,
  type DNIUploadRequest,
  type DNIUploadResponse,
  type DNIStatusResponse
} from '../models/dni'; 
import { User } from '../models/user'; 

const router = Router();

// ==================== FUNCIONES DE VALIDACIÓN ====================

/**
 * Valida imagen base64
 */
const validateImageBase64 = (imageBase64: string, mimeType: string): ImageValidation => {
  // Validar MIME type
  if (!isValidDNIMimeType(mimeType)) {
    return { 
      valid: false, 
      error: 'Formato de imagen no válido. Solo se permiten: JPEG, PNG, WEBP' 
    };
  }

  // Validar que no esté vacía
  if (!imageBase64 || imageBase64.length === 0) {
    return { valid: false, error: 'La imagen está vacía' };
  }

  // Validar tamaño
  const sizeInMB = getBase64SizeInMB(imageBase64);

  if (sizeInMB > DNI_CONFIG.MAX_SIZE_MB) {
    return { 
      valid: false, 
      error: `Imagen demasiado grande (${sizeInMB.toFixed(2)}MB). Máximo: ${DNI_CONFIG.MAX_SIZE_MB}MB` 
    };
  }

  return { valid: true };
};

// ==================== ENDPOINTS ====================

/**
 * POST /dni/upload
 * Sube foto del DNI del usuario autenticado
 */
router.post('/upload', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const userId = req.user?.uid;
  const { imageBase64, mimeType }: DNIUploadRequest = req.body;

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

  // Obtener bucket de Storage
  const bucket = admin.storage().bucket();
  
  // Generar nombre único para el archivo
  const fileName = generateDNIFileName(userId, mimeType);
  const file = bucket.file(fileName);

  // Convertir base64 a buffer
  const buffer = Buffer.from(imageBase64, 'base64');

  // Subir archivo a Storage (privado)
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

  // Obtener URL firmada (válida por X días)
  const expiryTime = Date.now() + (DNI_CONFIG.SIGNED_URL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: expiryTime,
  });

  console.log('✅ DNI subido exitosamente');
  console.log('📁 Archivo:', fileName);

  // Actualizar usuario en Firestore
  await db.collection('users').doc(userId).update({
    dniUrl: url,
    dniFileName: fileName,
    dniUploaded: true,
    dniUploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const response: DNIUploadResponse = {
    message: 'DNI subido exitosamente',
    dniUrl: url,
    dniUploaded: true,
    fileName: fileName
  };

  res.json(response);
}));

/**
 * GET /dni/status
 * Obtiene el estado de la subida del DNI
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

  const response: DNIStatusResponse = {
    userId: userId,
    dniStatus: {
      uploaded: userData?.dniUploaded || false,
      uploadedAt: userData?.dniUploadedAt || null,
      dniUrl: userData?.dniUrl || null,
      fileName: userData?.dniFileName || null
    }
  };

  res.json(response);
}));

/**
 * DELETE /dni
 * Elimina el DNI del usuario
 */
router.delete('/', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const userId = req.user?.uid;

  if (!userId) {
    throw new ApiError(401, 'Usuario no autenticado');
  }

  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const userData = userDoc.data() as User;

  if (!userData?.dniUploaded) {
    throw new ApiError(400, 'No hay DNI para eliminar');
  }

  // Eliminar archivo de Storage
  if (userData?.dniFileName) {
    try {
      const bucket = admin.storage().bucket();
      await bucket.file(userData.dniFileName).delete();
      console.log('🗑️  DNI eliminado:', userData.dniFileName);
    } catch (error) {
      console.error('Error eliminando archivo de Storage:', error);
      // No lanzar error, continuar con la limpieza de Firestore
    }
  }

  // Actualizar Firestore
  await db.collection('users').doc(userId).update({
    dniUrl: null,
    dniFileName: null,
    dniUploaded: false,
    dniUploadedAt: null,
    updatedAt: new Date().toISOString()
  });

  res.json({
    message: 'DNI eliminado exitosamente'
  });
}));

export default router;