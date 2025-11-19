import { Router } from 'express';
import { db } from '../config/firebase';
import admin from '../config/firebase';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

const router = Router();

// ==================== FUNCIONES DE VALIDACIÓN ====================

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

  // Obtener URL firmada (válida por 7 días)
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
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

  res.json({
    message: 'DNI subido exitosamente',
    dniUrl: url,
    dniUploaded: true,
    fileName: fileName
  });
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

  const userData = userDoc.data();

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