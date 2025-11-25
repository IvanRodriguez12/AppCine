import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../app/config/firebase';
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
  // ==================== REGISTRO ====================
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('📤 Registrando usuario en backend...');
      
      // 1️⃣ Registrar en tu API backend
      const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, data);
      const result = handleApiResponse<{ success: boolean; userId: string; email: string }>(response);

      if (!result.success || !result.data) {
        console.error('❌ Error en registro backend:', result.error);
        return {
          success: false,
          error: result.error || 'Error al registrar usuario'
        };
      }

      console.log('✅ Usuario registrado en backend:', result.data.userId);

      // 2️⃣ Autenticar automáticamente con Firebase
      try {
        console.log('🔐 Autenticando con Firebase...');
        
        const userCredential = await signInWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );

        console.log('✅ Usuario autenticado con Firebase:', userCredential.user.uid);

        // 3️⃣ Obtener el token de Firebase
        const firebaseToken = await userCredential.user.getIdToken();

        // 4️⃣ Guardar token y usuario en AsyncStorage
        await saveToken(firebaseToken);
        await saveUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: userCredential.user.displayName || data.displayName,
          age: 0,
          role: 'user',
          accountLevel: 'basic',
          accountStatus: 'active',
          isEmailVerified: false,
          dniUploaded: false,
          faceVerified: false,
          birthDate: data.birthDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        console.log('✅ Sesión guardada en AsyncStorage');

        // ✅ Retornar con el campo 'message' requerido
        return {
          success: true,
          message: 'Usuario registrado. Por favor verifica tu email.',
          data: {
            message: 'Usuario registrado. Por favor verifica tu email.',
            customToken: firebaseToken,
            user: {
              uid: userCredential.user.uid,
              email: userCredential.user.email!,
              displayName: userCredential.user.displayName || data.displayName,
              age: 0,
              role: 'user',
              accountLevel: 'basic',
              isEmailVerified: false, // ⬅️ Importante: false
              dniUploaded: false,
              faceVerified: false,
            }
          }
        };

      } catch (authError: any) {
        console.error('❌ Error al autenticar con Firebase:', authError);
        
        let errorMessage = 'Usuario registrado pero no se pudo iniciar sesión automáticamente';
        
        if (authError.code === 'auth/wrong-password') {
          errorMessage = 'Contraseña incorrecta';
        } else if (authError.code === 'auth/user-not-found') {
          errorMessage = 'Usuario no encontrado';
        } else if (authError.code === 'auth/network-request-failed') {
          errorMessage = 'Error de conexión. Verifica tu internet';
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

    } catch (error) {
      console.error('❌ Error general en registro:', error);
      return handleApiError(error);
    }
  }

  // ==================== LOGIN ====================
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('🔐 Iniciando sesión con Firebase...');
      
      // 1️⃣ Autenticar directamente con Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      console.log('✅ Usuario autenticado:', userCredential.user.uid);

      // 2️⃣ Obtener token de Firebase
      const firebaseToken = await userCredential.user.getIdToken();

      // 3️⃣ Intentar obtener datos del usuario desde tu backend (opcional)
      try {
        const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials);
        const result = handleApiResponse<AuthResponse>(response);

        if (result.success && result.data) {
          // Guardar token y usuario
          await saveToken(firebaseToken);
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
            birthDate: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          return result;
        }
      } catch (backendError) {
        console.warn('⚠️ No se pudo obtener datos del backend, usando solo Firebase');
      }

      // 4️⃣ Si el backend falló, usar solo datos de Firebase
      await saveToken(firebaseToken);
      await saveUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: userCredential.user.displayName || '',
        age: 0,
        role: 'user',
        accountLevel: 'basic',
        accountStatus: 'active',
        isEmailVerified: userCredential.user.emailVerified,
        dniUploaded: false,
        faceVerified: false,
        birthDate: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // ✅ Retornar con el campo 'message' requerido
      return {
        success: true,
        message: 'Login exitoso',
        data: {
          message: 'Login exitoso', // ⬅️ AGREGADO
          customToken: firebaseToken,
          user: {
            uid: userCredential.user.uid,
            email: userCredential.user.email!,
            displayName: userCredential.user.displayName || '',
            age: 0,
            role: 'user',
            accountLevel: 'basic',
            isEmailVerified: userCredential.user.emailVerified,
            dniUploaded: false,
            faceVerified: false,
          }
        }
      };

    } catch (error: any) {
      console.error('❌ Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = 'Credenciales inválidas';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Credenciales inválidas';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Intenta más tarde';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu internet';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ==================== RESTO DE MÉTODOS (SIN CAMBIOS) ====================

  async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, data);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  async resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, data);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      // Cerrar sesión en Firebase
      await auth.signOut();
      
      // Limpiar AsyncStorage
      await clearSession();

      console.log('✅ Sesión cerrada correctamente');

      return {
        success: true,
        message: 'Sesión cerrada correctamente',
      };
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      return handleApiError(error);
    }
  }

  async sendVerificationEmail(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.SEND_VERIFICATION_EMAIL);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  async verifyEmail(oobCode: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.VERIFY_EMAIL, { oobCode });
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

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

export default new AuthService();