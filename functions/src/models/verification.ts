/**
 * models/verification.ts
 * Interfaces y tipos para verificación facial con AWS Rekognition
 */

import { IMAGE_CONFIG } from './common';

/**
 * Datos de verificación facial almacenados en el documento del usuario
 */
export interface FaceVerificationData {
  faceVerified: boolean;
  faceVerificationScore: number | null; // 0-1 (normalizado)
  faceVerifiedAt: string | null;
  faceVerificationAttemptAt: string | null;
  selfieUrl: string | null;
  selfieFileName: string | null;
  lastVerificationError?: string | null;
}

/**
 * Request body para verificación facial
 */
export interface FaceVerificationRequest {
  imageBase64: string;
  mimeType: string;
}

/**
 * Respuesta exitosa de verificación facial
 */
export interface FaceVerificationSuccessResponse {
  message: string;
  verified: true;
  similarity: number; // 0-100
  selfieUrl: string;
  details?: any;
}

/**
 * Respuesta fallida de verificación facial
 */
export interface FaceVerificationFailureResponse {
  error: string;
  message: string;
  verified: false;
  similarity: number; // 0-100
  details?: any;
}

export type FaceVerificationResponse = 
  | FaceVerificationSuccessResponse 
  | FaceVerificationFailureResponse;

/**
 * Estado completo de verificación
 */
export interface VerificationStatusResponse {
  userId: string;
  email: string;
  accountLevel: string;
  accountStatus: string;
  verificationStatus: {
    email: {
      verified: boolean;
      verifiedAt: string | null;
    };
    dni: {
      uploaded: boolean;
      uploadedAt: string | null;
      url: string | null;
    };
    face: {
      verified: boolean;
      verifiedAt: string | null;
      similarity: number | null; // En porcentaje 0-100
      lastAttemptAt: string | null;
      lastError: string | null;
    };
  };
}

/**
 * Resultado de AWS Rekognition
 */
export interface RekognitionResult {
  success: boolean;
  verified: boolean;
  similarity: number; // 0-100
  message: string;
  details?: {
    confidence?: number;
    faceMatches?: any[];
    sourceImageFace?: any;
    targetImageFace?: any;
  };
}

/**
 * Tipos MIME permitidos para verificación facial (Rekognition solo soporta JPEG y PNG)
 */
export const ALLOWED_VERIFICATION_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png'
] as const;

export type VerificationMimeType = typeof ALLOWED_VERIFICATION_MIME_TYPES[number];

/**
 * Constantes de configuración
 */
export const VERIFICATION_CONFIG = {
  ...IMAGE_CONFIG,
  STORAGE_PATH: 'selfies',
  MIN_SIMILARITY_THRESHOLD: 80, // Umbral mínimo de similitud para aprobar
  HIGH_CONFIDENCE_THRESHOLD: 90,
  MEDIUM_CONFIDENCE_THRESHOLD: 85
} as const;

/**
 * Nivel de confianza basado en el score de similitud
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/**
 * Calcula el nivel de confianza basado en la similitud
 */
export const getConfidenceLevel = (similarity: number): ConfidenceLevel => {
  if (similarity >= VERIFICATION_CONFIG.HIGH_CONFIDENCE_THRESHOLD) return 'high';
  if (similarity >= VERIFICATION_CONFIG.MEDIUM_CONFIDENCE_THRESHOLD) return 'medium';
  return 'low';
};

/**
 * Valida que el MIME type sea permitido para verificación
 */
export const isValidVerificationMimeType = (mimeType: string): boolean => {
  return ALLOWED_VERIFICATION_MIME_TYPES.includes(
    mimeType.toLowerCase() as VerificationMimeType
  );
};

/**
 * Genera un nombre de archivo único para selfie
 */
export const generateSelfieFileName = (userId: string, mimeType: string): string => {
  const fileExtension = mimeType.split('/')[1];
  const timestamp = Date.now();
  return `${VERIFICATION_CONFIG.STORAGE_PATH}/${userId}_${timestamp}.${fileExtension}`;
};

/**
 * Convierte un score normalizado (0-1) a porcentaje (0-100)
 */
export const scoreToPercentage = (score: number): number => {
  return parseFloat((score * 100).toFixed(2));
};

/**
 * Convierte un porcentaje (0-100) a score normalizado (0-1)
 */
export const percentageToScore = (percentage: number): number => {
  return percentage / 100;
};

/**
 * Verifica si la similitud cumple el umbral mínimo
 */
export const meetsMinimumThreshold = (similarity: number): boolean => {
  return similarity >= VERIFICATION_CONFIG.MIN_SIMILARITY_THRESHOLD;
};