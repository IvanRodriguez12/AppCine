/**
 * services/storageService.ts
 * Servicio para gestionar Firebase Storage
 */

import admin from '../config/firebase';
import { ApiError } from '../middleware/errorHandler';

/**
 * Opciones para subir archivo
 */
interface UploadOptions {
  userId: string;
  folder: 'dni' | 'selfies' | 'profiles';
  mimeType: string;
  makePublic?: boolean;
  expiryDays?: number;
}

/**
 * Resultado de subida
 */
interface UploadResult {
  fileName: string;
  url: string;
  path: string;
}

/**
 * Servicio de Storage
 */
class StorageService {
  private bucket = admin.storage().bucket();

  /**
   * Sube un archivo a Firebase Storage
   */
  async uploadFile(
    buffer: Buffer,
    options: UploadOptions
  ): Promise<UploadResult> {
    const { userId, folder, mimeType, makePublic = false, expiryDays = 7 } = options;

    // Generar nombre único
    const fileExtension = mimeType.split('/')[1];
    const timestamp = Date.now();
    const fileName = `${folder}/${userId}_${timestamp}.${fileExtension}`;

    const file = this.bucket.file(fileName);

    try {
      // Subir archivo
      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            userId,
            uploadedAt: new Date().toISOString(),
            folder
          }
        },
        public: makePublic
      });

      console.log(`✅ Archivo subido: ${fileName}`);

      // Obtener URL
      let url: string;

      if (makePublic) {
        await file.makePublic();
        url = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
      } else {
        // URL firmada
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + expiryDays * 24 * 60 * 60 * 1000
        });
        url = signedUrl;
      }

      return {
        fileName,
        url,
        path: `gs://${this.bucket.name}/${fileName}`
      };
    } catch (error: any) {
      console.error('❌ Error subiendo archivo:', error);
      throw new ApiError(500, `Error al subir archivo: ${error.message}`);
    }
  }

  /**
   * Elimina un archivo de Storage
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.bucket.file(fileName).delete();
      console.log(`🗑️  Archivo eliminado: ${fileName}`);
    } catch (error: any) {
      if (error.code === 404) {
        console.warn(`⚠️  Archivo no encontrado: ${fileName}`);
      } else {
        console.error('❌ Error eliminando archivo:', error);
        throw new ApiError(500, `Error al eliminar archivo: ${error.message}`);
      }
    }
  }

  /**
   * Descarga un archivo de Storage
   */
  async downloadFile(fileName: string): Promise<Buffer> {
    try {
      const file = this.bucket.file(fileName);
      const [buffer] = await file.download();
      return buffer;
    } catch (error: any) {
      console.error('❌ Error descargando archivo:', error);
      throw new ApiError(500, `Error al descargar archivo: ${error.message}`);
    }
  }

  /**
   * Verifica si un archivo existe
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const [exists] = await this.bucket.file(fileName).exists();
      return exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene metadatos de un archivo
   */
  async getFileMetadata(fileName: string): Promise<any> {
    try {
      const [metadata] = await this.bucket.file(fileName).getMetadata();
      return metadata;
    } catch (error: any) {
      throw new ApiError(404, `Archivo no encontrado: ${fileName}`);
    }
  }

  /**
   * Genera una URL firmada para un archivo existente
   */
  async getSignedUrl(fileName: string, expiryDays: number = 7): Promise<string> {
    try {
      const file = this.bucket.file(fileName);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiryDays * 24 * 60 * 60 * 1000
      });
      return url;
    } catch (error: any) {
      throw new ApiError(500, `Error generando URL: ${error.message}`);
    }
  }

  /**
   * Lista archivos de un usuario en una carpeta específica
   */
  async listUserFiles(userId: string, folder: string): Promise<string[]> {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: `${folder}/${userId}_`
      });

      return files.map(file => file.name);
    } catch (error: any) {
      throw new ApiError(500, `Error listando archivos: ${error.message}`);
    }
  }

  /**
   * Elimina todos los archivos de un usuario
   */
  async deleteAllUserFiles(userId: string): Promise<void> {
    try {
      const folders = ['dni', 'selfies', 'profiles'];

      for (const folder of folders) {
        const files = await this.listUserFiles(userId, folder);
        
        for (const fileName of files) {
          await this.deleteFile(fileName);
        }
      }

      console.log(`🗑️  Todos los archivos del usuario ${userId} eliminados`);
    } catch (error: any) {
      throw new ApiError(500, `Error eliminando archivos: ${error.message}`);
    }
  }
}

export default new StorageService();