import apiClient, { handleApiError, handleApiResponse } from '../api/client';
import { AUTH_ENDPOINTS } from '../api/endpoints';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiResponse,
  ForgotPasswordData,
  ResetPasswordData,
} from '../types';
import { saveToken, saveUser, clearSession } from '../utils/storage';

class AuthService {
  // Registro de usuario
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, data);
      const result = handleApiResponse<AuthResponse>(response);

      // Guardar customToken y usuario
      if (result.success && result.data) {
        await saveToken(result.data.customToken);
        await saveUser({
          uid: result.data.user.uid,
          email: result.data.user.email,
          displayName: result.data.user.displayName,
          age: result.data.user.age,
          role: result.data.user.role as 'user' | 'admin',
          accountLevel: result.data.user.accountLevel as 'basic' | 'verified' | 'premium',
          accountStatus: 'active',
          isEmailVerified: result.data.user.isEmailVerified,
          dniUploaded: result.data.user.dniUploaded,
          faceVerified: result.data.user.faceVerified,
          birthDate: data.birthDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Inicio de sesión
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials);
      const result = handleApiResponse<AuthResponse>(response);

      // Guardar customToken y usuario
      if (result.success && result.data) {
        await saveToken(result.data.customToken);
        await saveUser({
          uid: result.data.user.uid,
          email: result.data.user.email,
          displayName: result.data.user.displayName,
          age: result.data.user.age,
          role: result.data.user.role as 'user' | 'admin',
          accountLevel: result.data.user.accountLevel as 'basic' | 'verified' | 'premium',
          accountStatus: 'active',
          isEmailVerified: result.data.user.isEmailVerified,
          dniUploaded: result.data.user.dniUploaded,
          faceVerified: result.data.user.faceVerified,
          birthDate: '', // No viene en login, se puede obtener del perfil después
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Solicitar restablecimiento de contraseña
  async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(
        AUTH_ENDPOINTS.FORGOT_PASSWORD,
        data
      );
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Restablecer contraseña con código
  async resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, data);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Cerrar sesión (solo limpia local, no hay endpoint de logout real)
  async logout(): Promise<ApiResponse> {
    try {
      await clearSession();

      return {
        success: true,
        message: 'Sesión cerrada correctamente',
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Enviar email de verificación
  async sendVerificationEmail(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(
        AUTH_ENDPOINTS.SEND_VERIFICATION_EMAIL
      );
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Verificar email
  async verifyEmail(oobCode: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.VERIFY_EMAIL, {
        oobCode,
      });
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Cambiar contraseña (usuario autenticado)
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }
}

// Exportar instancia única (Singleton)
export default new AuthService();