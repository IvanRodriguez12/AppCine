import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

// Claves para AsyncStorage
const STORAGE_KEYS = {
  TOKEN: '@cineapp_token',
  REFRESH_TOKEN: '@cineapp_refresh_token',
  USER: '@cineapp_user',
  ONBOARDING_COMPLETED: '@cineapp_onboarding',
};

// Guardar token
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } catch (error) {
    console.error('Error saving token:', error);
    throw error;
  }
};

// Obtener token
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Eliminar token
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error removing token:', error);
    throw error;
  }
};

// Guardar usuario
export const saveUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

// Obtener usuario
export const getUser = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Eliminar usuario
export const removeUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Error removing user:', error);
    throw error;
  }
};

// Limpiar toda la sesión
export const clearSession = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
  } catch (error) {
    console.error('Error clearing session:', error);
    throw error;
  }
};

// Verificar si el onboarding fue completado
export const isOnboardingCompleted = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding:', error);
    return false;
  }
};

// Marcar onboarding como completado
export const setOnboardingCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
  } catch (error) {
    console.error('Error setting onboarding:', error);
    throw error;
  }
};