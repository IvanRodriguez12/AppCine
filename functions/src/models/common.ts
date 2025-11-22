/**
 * models/common.ts
 * Tipos e interfaces compartidas entre modelos
 */

/**
 * Resultado de validación de imagen
 */
export interface ImageValidation {
  valid: boolean;
  error?: string;
}

/**
 * Configuración común de imágenes
 */
export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  SIGNED_URL_EXPIRY_DAYS: 7
} as const;

/**
 * Calcula el tamaño de una imagen base64 en MB
 */
export const getBase64SizeInMB = (base64: string): number => {
  const sizeInBytes = (base64.length * 3) / 4;
  return sizeInBytes / (1024 * 1024);
};