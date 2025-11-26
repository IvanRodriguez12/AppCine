import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { router } from 'expo-router';
import { User } from '../types';
import { getToken, getUser, clearSession, saveUser } from '../utils/storage';
import authService from '../services/authService';
import apiClient from '../api/client';
import { USER_ENDPOINTS } from '../api/endpoints';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuthFlow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        const response = await apiClient.get(`/users/${storedUser.uid}`);

        if (response.data) {
          const updatedUser = {
            ...storedUser,                 // ⬅️ NO SE PIERDEN DATOS LOCALES
            ...response.data,              // ⬅️ SE ACTUALIZAN DATOS DEL BACKEND (ej. nombre)
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

  const checkAuthFlow = async () => {
    await refreshUser();

    const currentUser = await getUser();

    if (!currentUser) {
      router.replace('/(auth)/iniciarSesion');
      return;
    }

    // 🆕 SI ES ADMIN, IR DIRECTO AL DASHBOARD
    if (currentUser.role === 'admin') {
      console.log('👑 Usuario admin detectado, redirigiendo a dashboard');
      router.replace('/(admin)/dashboard');
      return;
    }

    // FLUJO NORMAL PARA USUARIOS
    if (!currentUser.isEmailVerified) {
      console.log('📧 Email no verificado');
      router.replace('/(auth)/verificarEmail');
      return;
    }

    if (!currentUser.dniUploaded) {
      console.log('🪪 DNI no subido');
      router.replace('/(auth)/verificarIdentidad');
      return;
    }

    if (!currentUser.faceVerified) {
      console.log('👤 Rostro no verificado');
      router.replace('/(auth)/Scan');
      return;
    }

    console.log('✅ Verificación completa');
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

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
};
