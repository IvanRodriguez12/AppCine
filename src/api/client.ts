import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './endpoints';
import { getToken, clearSession } from '../utils/storage';
import { ApiError, ApiResponse } from '../types';

// Tipo para las respuestas de error del backend
interface BackendErrorResponse {
  error?: string;
  message?: string;
  details?: any;
}

// Crear instancia de Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request - Agregar customToken automáticamente
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const customToken = await getToken();
    
    if (customToken && config.headers) {
      // Firebase usa customToken, lo enviamos en Authorization
      config.headers.Authorization = `Bearer ${customToken}`;
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor de Response - Manejar errores globalmente
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.config.url}`, response.status);
    return response;
  },
  async (error: AxiosError<BackendErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si el error es 401 (token expirado)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Aquí podrías implementar refresh token si lo necesitas
        // const newToken = await refreshToken();
        // await saveToken(newToken);
        // originalRequest.headers.Authorization = `Bearer ${newToken}`;
        // return apiClient(originalRequest);
        
        // Por ahora, solo limpiamos la sesión
        await clearSession();
        console.log('🔒 Sesión expirada, limpiando datos...');
      } catch (refreshError) {
        console.error('❌ Error al refrescar token:', refreshError);
        await clearSession();
        return Promise.reject(refreshError);
      }
    }

    // Formatear error con tipado correcto
    const apiError: ApiError = {
      message: error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               'Error desconocido',
      code: error.code,
      status: error.response?.status,
    };

    console.error('❌ API Error:', apiError);
    return Promise.reject(apiError);
  }
);

// Función helper para manejar respuestas
export const handleApiResponse = <T = any>(response: AxiosResponse<T>): ApiResponse<T> => {
  return {
    success: true,
    data: response.data,
    message: (response.data as any)?.message,
  };
};

// Función helper para manejar errores
export const handleApiError = (error: any): ApiResponse => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<BackendErrorResponse>;
    
    if (axiosError.response) {
      // Error de respuesta del servidor
      return {
        success: false,
        error: axiosError.response.data?.error || 
               axiosError.response.data?.message || 
               'Error del servidor',
        message: axiosError.response.data?.message,
      };
    } else if (axiosError.request) {
      // Error de red
      return {
        success: false,
        error: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      };
    }
  }
  
  // Otro tipo de error
  return {
    success: false,
    error: error?.message || 'Ocurrió un error inesperado',
  };
};

export default apiClient;