/**
 * models/user.ts
 * Interfaces y tipos para el modelo de Usuario
 */

export type UserRole = 'user' | 'admin' | 'moderator';
export type AccountStatus = 'active' | 'suspended' | 'banned' | 'pending';
export type AccountLevel = 'basic' | 'verified' | 'premium' | 'full';

/**
 * Interface principal del Usuario
 */
export interface User {
  uid: string;
  email: string;
  displayName: string;
  phone: string | null;
  photoURL?: string;
  bio?: string;
  
  // Datos personales
  birthDate: string;
  age: number;
  
  // Roles y permisos
  role: UserRole;
  accountStatus: AccountStatus;
  accountLevel: AccountLevel;
  
  // Verificaciones
  isEmailVerified: boolean;
  emailVerifiedAt: string | null;
  emailVerificationSentAt?: string | null;
  
  dniUploaded: boolean;
  dniUrl: string | null;
  dniFileName: string | null;
  dniUploadedAt: string | null;
  
  faceVerified: boolean;
  faceVerificationScore: number | null;
  faceVerifiedAt: string | null;
  faceVerificationAttemptAt: string | null;
  selfieUrl: string | null;
  selfieFileName: string | null;
  lastVerificationError?: string | null;
  
  // Preferencias
  favorites: number[];
  watchlist: number[];
  
  // Términos y condiciones
  acceptedTerms: boolean;
  acceptedTermsAt: string;

  // Suscripción Premium
  isPremium: boolean;
  premiumUntilAt: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  passwordChangedAt?: string | null;
}

/**
 * Datos públicos del usuario (sin información sensible)
 */
export interface PublicUserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  role: UserRole;
  accountLevel: AccountLevel;
  isEmailVerified: boolean;
  dniUploaded: boolean;
  faceVerified: boolean;
  createdAt: string;
}

/**
 * Datos para registro de usuario
 */
export interface UserRegistrationData {
  email: string;
  password: string;
  displayName: string;
  birthDate: string;
  phone?: string;
  acceptTerms: boolean;
}

/**
 * Datos para actualización de perfil
 */
export interface UserUpdateData {
  displayName?: string;
  photoURL?: string;
  bio?: string;
  phone?: string;
}

/**
 * Convierte un User a PublicUserProfile
 */
export const toPublicProfile = (uid: string, userData: Partial<User>): PublicUserProfile => {
  return {
    uid,
    displayName: userData.displayName || '',
    photoURL: userData.photoURL,
    bio: userData.bio,
    role: userData.role || 'user',
    accountLevel: userData.accountLevel || 'basic',
    isEmailVerified: userData.isEmailVerified || false,
    dniUploaded: userData.dniUploaded || false,
    faceVerified: userData.faceVerified || false,
    createdAt: userData.createdAt || new Date().toISOString()
  };
};

/**
 * Datos iniciales al crear un usuario
 */
export const createUserInitialData = (
  email: string,
  displayName: string,
  birthDate: string,
  age: number,
  phone?: string
): Omit<User, 'uid'> => {
  const now = new Date().toISOString();
  
  return {
    email,
    displayName,
    phone: phone || null,
    birthDate,
    age,
    role: 'user',
    isEmailVerified: false,
    emailVerifiedAt: null,
    dniUploaded: false,
    dniUrl: null,
    dniFileName: null,
    dniUploadedAt: null,
    faceVerified: false,
    faceVerificationScore: null,
    faceVerifiedAt: null,
    faceVerificationAttemptAt: null,
    selfieUrl: null,
    selfieFileName: null,
    accountStatus: 'active',
    accountLevel: 'basic',
    favorites: [],
    watchlist: [],
    acceptedTerms: true,
    acceptedTermsAt: now,
    isPremium: false,
    premiumUntilAt: null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null
  };
};