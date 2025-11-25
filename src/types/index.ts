// Tipos de Usuario
export interface User {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  birthDate: string;
  age: number;
  role: 'user' | 'admin';
  accountLevel: 'basic' | 'verified' | 'premium';
  accountStatus: 'active' | 'suspended' | 'banned';
  isEmailVerified: boolean;
  dniUploaded: boolean;
  dniUrl?: string;
  dniFileName?: string;
  faceVerified: boolean;
  selfieUrl?: string;
  selfieFileName?: string;
  faceVerificationScore?: number;
  createdAt: string;
  lastLoginAt?: string;
  updatedAt: string;
}

// Tipos de Autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  birthDate: string;
  phone?: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  message: string;
  user: {
    uid: string;
    email: string;
    displayName: string;
    age: number;
    role: string;
    accountLevel: string;
    isEmailVerified: boolean;
    dniUploaded: boolean;
    faceVerified: boolean;
  };
  customToken: string;
}

// Tipos de API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Tipos de Error
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Tipos para Reset Password
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  oobCode: string;
  newPassword: string;
}

// Tipos para DNI Upload
export interface DNIUploadData {
  imageBase64: string;
  mimeType: string;
}

export interface DNIUploadResponse {
  message: string;
  dniUrl: string;
  dniUploaded: boolean;
  fileName: string;
}

// Tipos para Verificación Facial
export interface FaceVerificationData {
  imageBase64: string;
  mimeType: string;
}

export interface FaceVerificationResponse {
  message: string;
  verified: boolean;
  similarity: number;
  selfieUrl?: string;
  details?: any;
}