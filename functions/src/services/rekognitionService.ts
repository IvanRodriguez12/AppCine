import { 
  DetectFacesCommand, 
  CompareFacesCommand,
  DetectFacesCommandInput,
  CompareFacesCommandInput
} from '@aws-sdk/client-rekognition';
import { rekognitionClient } from '../config/aws';

// ==================== INTERFACES ====================

export interface FaceDetectionResult {
  success: boolean;
  faceDetected: boolean;
  faceCount: number;
  confidence?: number;
  details?: {
    ageRange?: { low: number; high: number };
    smile?: boolean;
    eyesOpen?: boolean;
    sunglasses?: boolean;
    emotions?: Array<{ type: string; confidence: number }>;
  };
  error?: string;
}

export interface FaceComparisonResult {
  success: boolean;
  match: boolean;
  similarity: number; // 0-100
  confidence: number; // 0-100
  threshold: number;
  error?: string;
}

// ==================== FUNCIONES PRINCIPALES ====================

/**
 * Detecta rostros en una imagen
 * @param imageBuffer - Buffer de la imagen en formato JPEG/PNG
 * @returns Resultado de la detección
 */
export async function detectFaces(imageBuffer: Buffer): Promise<FaceDetectionResult> {
  try {
    const params: DetectFacesCommandInput = {
      Image: {
        Bytes: imageBuffer
      },
      Attributes: ['ALL'] // Obtener todos los atributos del rostro
    };

    const command = new DetectFacesCommand(params);
    const response = await rekognitionClient.send(command);

    const faceDetails = response.FaceDetails || [];

    if (faceDetails.length === 0) {
      return {
        success: true,
        faceDetected: false,
        faceCount: 0,
        error: 'No se detectó ningún rostro en la imagen'
      };
    }

    if (faceDetails.length > 1) {
      return {
        success: true,
        faceDetected: true,
        faceCount: faceDetails.length,
        error: 'Se detectaron múltiples rostros. Por favor, asegúrate de que solo aparezca tu rostro'
      };
    }

    // Obtener el primer (y único) rostro
    const face = faceDetails[0];

    return {
      success: true,
      faceDetected: true,
      faceCount: 1,
      confidence: face.Confidence,
      details: {
        ageRange: face.AgeRange ? {
          low: face.AgeRange.Low || 0,
          high: face.AgeRange.High || 0
        } : undefined,
        smile: face.Smile?.Value || false,
        eyesOpen: face.EyesOpen?.Value || false,
        sunglasses: face.Sunglasses?.Value || false,
        emotions: face.Emotions?.map(e => ({
          type: e.Type || '',
          confidence: e.Confidence || 0
        })) || []
      }
    };

  } catch (error: any) {
    console.error('❌ Error en detectFaces:', error);
    return {
      success: false,
      faceDetected: false,
      faceCount: 0,
      error: `Error detectando rostro: ${error.message}`
    };
  }
}

/**
 * Compara dos rostros (selfie vs DNI)
 * @param sourceImageBuffer - Buffer de la imagen fuente (selfie)
 * @param targetImageBuffer - Buffer de la imagen objetivo (DNI)
 * @param similarityThreshold - Umbral mínimo de similitud (0-100, default: 85)
 * @returns Resultado de la comparación
 */
export async function compareFaces(
  sourceImageBuffer: Buffer,
  targetImageBuffer: Buffer,
  similarityThreshold: number = 85
): Promise<FaceComparisonResult> {
  try {
    const params: CompareFacesCommandInput = {
      SourceImage: {
        Bytes: sourceImageBuffer
      },
      TargetImage: {
        Bytes: targetImageBuffer
      },
      SimilarityThreshold: similarityThreshold
    };

    const command = new CompareFacesCommand(params);
    const response = await rekognitionClient.send(command);

    const faceMatches = response.FaceMatches || [];

    // Si no hay coincidencias
    if (faceMatches.length === 0) {
      return {
        success: true,
        match: false,
        similarity: 0,
        confidence: 0,
        threshold: similarityThreshold,
        error: 'Los rostros no coinciden. Asegúrate de usar la misma persona en ambas fotos.'
      };
    }

    // Obtener la mejor coincidencia
    const bestMatch = faceMatches[0];
    const similarity = bestMatch.Similarity || 0;
    const confidence = bestMatch.Face?.Confidence || 0;

    return {
      success: true,
      match: similarity >= similarityThreshold,
      similarity: parseFloat(similarity.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(2)),
      threshold: similarityThreshold
    };

  } catch (error: any) {
    console.error('❌ Error en compareFaces:', error);
    return {
      success: false,
      match: false,
      similarity: 0,
      confidence: 0,
      threshold: similarityThreshold,
      error: `Error comparando rostros: ${error.message}`
    };
  }
}

/**
 * Proceso completo de verificación facial
 * @param selfieBuffer - Buffer de la selfie
 * @param dniBuffer - Buffer del DNI
 * @returns Resultado completo de la verificación
 */
export async function verifyFace(
  selfieBuffer: Buffer,
  dniBuffer: Buffer
): Promise<{
  success: boolean;
  verified: boolean;
  similarity: number;
  message: string;
  details?: {
    selfieAnalysis: FaceDetectionResult;
    dniAnalysis: FaceDetectionResult;
    comparison: FaceComparisonResult;
  };
}> {
  try {
    console.log('📸 Analizando selfie...');
    const selfieAnalysis = await detectFaces(selfieBuffer);

    if (!selfieAnalysis.success) {
      return {
        success: false,
        verified: false,
        similarity: 0,
        message: selfieAnalysis.error || 'Error analizando selfie'
      };
    }

    if (!selfieAnalysis.faceDetected) {
      return {
        success: true,
        verified: false,
        similarity: 0,
        message: 'No se detectó un rostro en la selfie. Por favor, toma otra foto.'
      };
    }

    if (selfieAnalysis.faceCount > 1) {
      return {
        success: true,
        verified: false,
        similarity: 0,
        message: 'Se detectaron múltiples rostros en la selfie. Asegúrate de que solo aparezcas tú.'
      };
    }

    console.log('🪪 Analizando DNI...');
    const dniAnalysis = await detectFaces(dniBuffer);

    if (!dniAnalysis.success) {
      return {
        success: false,
        verified: false,
        similarity: 0,
        message: dniAnalysis.error || 'Error analizando DNI'
      };
    }

    if (!dniAnalysis.faceDetected) {
      return {
        success: true,
        verified: false,
        similarity: 0,
        message: 'No se detectó un rostro en el DNI. Por favor, sube una foto clara de tu documento.'
      };
    }

    console.log('🔍 Comparando rostros...');
    const comparison = await compareFaces(selfieBuffer, dniBuffer, 85);

    if (!comparison.success) {
      return {
        success: false,
        verified: false,
        similarity: 0,
        message: comparison.error || 'Error comparando rostros'
      };
    }

    const verified = comparison.match && comparison.similarity >= 85;

    return {
      success: true,
      verified,
      similarity: comparison.similarity,
      message: verified
        ? `¡Verificación exitosa! Similitud: ${comparison.similarity}%`
        : `Verificación fallida. Los rostros no coinciden (similitud: ${comparison.similarity}%)`,
      details: {
        selfieAnalysis,
        dniAnalysis,
        comparison
      }
    };

  } catch (error: any) {
    console.error('❌ Error en verifyFace:', error);
    return {
      success: false,
      verified: false,
      similarity: 0,
      message: `Error en el proceso de verificación: ${error.message}`
    };
  }
}

/**
 * Valida la calidad de la imagen para Rekognition
 */
export function validateImageForRekognition(buffer: Buffer): { valid: boolean; error?: string } {
  if (buffer.length < 5000) {
    return {
      valid: false,
      error: 'La imagen es demasiado pequeña. Usa una foto de mayor resolución.'
    };
  }

  if (buffer.length > 5 * 1024 * 1024) {
    return {
      valid: false,
      error: 'La imagen es demasiado grande. Máximo 5MB.'
    };
  }

  return { valid: true };
}