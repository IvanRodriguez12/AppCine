/**
 * models/dni.ts
 * Interfaces y tipos para documentos de identidad (DNI)
 */

import { IMAGE_CONFIG} from './common';

/**
 * Datos del DNI almacenados en el documento del usuario
 */
export interface DNIData {
  dniUploaded: boolean;
  dniUrl: string | null;
  dniFileName: string | null;
  dniUploadedAt: string | null;
}

/**
 * Request body para subir DNI
 */
export interface DNIUploadRequest {
  imageBase64: string;
  mimeType: string;
}

/**
 * Respuesta al subir DNI
 */
export interface DNIUploadResponse {
  message: string;
  dniUrl: string;
  dniUploaded: boolean;
  fileName: string;
}

/**
 * Estado del DNI
 */
export interface DNIStatusResponse {
  userId: string;
  dniStatus: {
    uploaded: boolean;
    uploadedAt: string | null;
    dniUrl: string | null;
    fileName: string | null;
  };
}

/**
 * Tipos MIME permitidos para DNI
 */
export const ALLOWED_DNI_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
] as const;

export type DNIMimeType = typeof ALLOWED_DNI_MIME_TYPES[number];

/**
 * Constantes de configuración
 */
export const DNI_CONFIG = {
  ...IMAGE_CONFIG,
  STORAGE_PATH: 'dni'
} as const;

/**
 * Valida que el MIME type sea permitido
 */
export const isValidDNIMimeType = (mimeType: string): boolean => {
  return ALLOWED_DNI_MIME_TYPES.includes(mimeType.toLowerCase() as DNIMimeType);
};

/**
 * Genera un nombre de archivo único para DNI
 */
export const generateDNIFileName = (userId: string, mimeType: string): string => {
  const fileExtension = mimeType.split('/')[1];
  const timestamp = Date.now();
  return `${DNI_CONFIG.STORAGE_PATH}/${userId}_${timestamp}.${fileExtension}`;
};

// Re-exportar desde common
export { getBase64SizeInMB } from './common';