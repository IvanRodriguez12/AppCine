import apiClient, { handleApiError, handleApiResponse } from '../api/client';
import { DNI_ENDPOINTS, VERIFICATION_ENDPOINTS, USER_ENDPOINTS, buildUrl } from '../api/endpoints';
import {
  ApiResponse,
  DNIUploadData,
  DNIUploadResponse,
  FaceVerificationData,
  FaceVerificationResponse,
  User,
} from '../types';

class UserService {
  // ==================== DNI ====================

  // Subir DNI
  async uploadDNI(data: DNIUploadData): Promise<ApiResponse<DNIUploadResponse>> {
    try {
      const response = await apiClient.post(DNI_ENDPOINTS.UPLOAD, data);
      return handleApiResponse<DNIUploadResponse>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Obtener estado del DNI
  async getDNIStatus(): Promise<ApiResponse> {
    try {
      const response = await apiClient.get(DNI_ENDPOINTS.STATUS);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Eliminar DNI
  async deleteDNI(): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(DNI_ENDPOINTS.DELETE);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // ==================== VERIFICACIÓN FACIAL ====================

  // Verificar rostro
  async verifyFace(data: FaceVerificationData): Promise<ApiResponse<FaceVerificationResponse>> {
    try {
      const response = await apiClient.post(VERIFICATION_ENDPOINTS.VERIFY_FACE, data);
      return handleApiResponse<FaceVerificationResponse>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Obtener estado de verificación
  async getVerificationStatus(): Promise<ApiResponse> {
    try {
      const response = await apiClient.get(VERIFICATION_ENDPOINTS.GET_STATUS);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Eliminar verificación facial
  async deleteFaceVerification(): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(VERIFICATION_ENDPOINTS.DELETE_FACE);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // ==================== PERFIL ====================

  // Obtener perfil de usuario
  async getProfile(userId: string): Promise<ApiResponse<User>> {
    try {
      const url = buildUrl(USER_ENDPOINTS.GET_PROFILE, { id: userId });
      const response = await apiClient.get(url);
      return handleApiResponse<User>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Actualizar perfil
  async updateProfile(
    userId: string,
    data: { displayName?: string; photoURL?: string; bio?: string; phone?: string }
  ): Promise<ApiResponse> {
    try {
      const url = buildUrl(USER_ENDPOINTS.UPDATE_PROFILE, { id: userId });
      const response = await apiClient.put(url, data);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // ==================== FAVORITOS ====================

  // Obtener favoritos
  async getFavorites(userId: string): Promise<ApiResponse> {
    try {
      const url = buildUrl(USER_ENDPOINTS.GET_FAVORITES, { id: userId });
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Agregar a favoritos
  async addFavorite(userId: string, movieId: number): Promise<ApiResponse> {
    try {
      const url = buildUrl(USER_ENDPOINTS.ADD_FAVORITE, { id: userId });
      const response = await apiClient.post(url, { movieId });
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Eliminar de favoritos
  async removeFavorite(userId: string, movieId: number): Promise<ApiResponse> {
    try {
      const url = buildUrl(USER_ENDPOINTS.REMOVE_FAVORITE, {
        id: userId,
        movieId: movieId.toString(),
      });
      const response = await apiClient.delete(url);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }
}

// Exportar instancia única (Singleton)
export default new UserService();