import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { router } from 'expo-router';
import { User } from '../types';
import { getToken, getUser, clearSession, saveUser } from '../utils/storage';
import authService from '../services/authService';
import apiClient from '../api/client';
import { USER_ENDPOINTS } from '../api/endpoints';

// Tipo del contexto
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuthFlow: () => Promise<void>;
}

// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sesión al montar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      const storedUser = await getUser();

      if (token && storedUser) {
        setUser(storedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await authService.login({ email, password });
    
    if (!result.success) {
      throw new Error(result.error || 'Error al iniciar sesión');
    }

    // El usuario ya fue guardado por authService
    await refreshUser();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    router.replace('/(auth)/iniciarSesion');
  };

  const refreshUser = async () => {
    try {
      const storedUser = await getUser();
      
      if (storedUser) {
        // Obtener datos actualizados del backend
        const response = await apiClient.get(`/users/${storedUser.uid}`);
        
        if (response.data) {
          const updatedUser = {
            ...storedUser,
            isEmailVerified: response.data.isEmailVerified || false,
            dniUploaded: response.data.dniUploaded || false,
            faceVerified: response.data.faceVerified || false,
            accountLevel: response.data.accountLevel || 'basic',
          };
          
          await saveUser(updatedUser);
          setUser(updatedUser);
        } else {
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      const storedUser = await getUser();
      setUser(storedUser);
    }
  };

  // ✅ FUNCIÓN CLAVE: Verifica qué pantalla mostrar según el estado del usuario
  const checkAuthFlow = async () => {
    // Primero refrescar el usuario para obtener datos actualizados
    await refreshUser();
    
    const currentUser = await getUser();
    
    if (!currentUser) {
      router.replace('/(auth)/iniciarSesion');
      return;
    }

    console.log('🔍 Verificando flujo de autenticación...');
    console.log('📧 Email verificado:', currentUser.isEmailVerified);
    console.log('🪪 DNI subido:', currentUser.dniUploaded);
    console.log('👤 Rostro verificado:', currentUser.faceVerified);

    // 1️⃣ Si NO verificó email → pantalla de verificación de email
    if (!currentUser.isEmailVerified) {
      console.log('➡️  Redirigiendo a verificar email');
      router.replace('/(auth)/verificarEmail');
      return;
    }

    // 2️⃣ Si NO subió DNI → pantalla de subir DNI
    if (!currentUser.dniUploaded) {
      console.log('➡️  Redirigiendo a verificar identidad');
      router.replace('/(auth)/verificarIdentidad');
      return;
    }

    // 3️⃣ Si NO verificó rostro → pantalla de verificación facial
    if (!currentUser.faceVerified) {
      console.log('➡️  Redirigiendo a scan facial');
      router.replace('/(auth)/Scan');
      return;
    }

    // 4️⃣ Si completó todo → mensaje de bienvenida
    console.log('✅ Verificación completa - Redirigiendo a bienvenida');
    router.replace('/(auth)/mensajeBienvenida');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    checkAuthFlow,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};