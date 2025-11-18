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
  // Validar que sea una imagen
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(mimeType.toLowerCase())) {
    return { 
      valid: false, 
      error: 'Formato de imagen no válido. Solo se permiten: JPEG, PNG, WEBP' 
    };
  }

  // Validar que no esté vacío
  if (!imageBase64 || imageBase64.length === 0) {
    return { valid: false, error: 'La imagen está vacía' };
  }

  // Calcular tamaño aproximado en MB (base64 es ~33% más grande que el original)
  const sizeInBytes = (imageBase64.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  // Validar tamaño máximo (5MB)
  if (sizeInMB > 5) {
    return { 
      valid: false, 
      error: `Imagen demasiado grande (${sizeInMB.toFixed(2)}MB). Máximo: 5MB` 
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

  // Obtener bucket de Storage
  const bucket = admin.storage().bucket();
  
  // Crear nombre único para el archivo
  const fileExtension = mimeType.split('/')[1];
  const fileName = `dni/${userId}_${Date.now()}.${fileExtension}`;
  const file = bucket.file(fileName);

  // Convertir base64 a buffer
  const buffer = Buffer.from(imageBase64, 'base64');

  // Subir archivo a Storage
  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      metadata: {
        userId: userId,
        uploadedAt: new Date().toISOString()
      }
    },
    public: false, // No hacer público por seguridad
  });

  // Obtener URL firmada (válida por 7 días)
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
  });

  // Actualizar usuario en Firestore
  await db.collection('users').doc(userId).update({
    dniUrl: url,
    dniFileName: fileName,
    dniUploaded: true,
    dniUploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  res.json({
    message: 'DNI subido exitosamente',
    dniUrl: url,
    dniUploaded: true,
    fileName: fileName
  });
}));

/**
 * GET /dni/status
 * Obtiene el estado de la subida del DNI del usuario autenticado
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
    dniStatus: {
      uploaded: userData?.dniUploaded || false,
      uploadedAt: userData?.dniUploadedAt,
      dniUrl: userData?.dniUrl,
      fileName: userData?.dniFileName
    }
  });
}));

/**
 * DELETE /dni
 * Elimina el DNI del usuario autenticado
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

  const userData = userDoc.data();

  if (!userData?.dniUploaded) {
    throw new ApiError(400, 'No hay DNI para eliminar');
  }

  // Eliminar archivo de Storage si existe
  if (userData?.dniFileName) {
    try {
      const bucket = admin.storage().bucket();
      await bucket.file(userData.dniFileName).delete();
    } catch (error) {
      console.error('Error eliminando archivo de Storage:', error);
      // Continuar aunque falle la eliminación del archivo
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