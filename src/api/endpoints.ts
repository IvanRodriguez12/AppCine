// Base URL de tu backend
export const API_BASE_URL = 'https://api-ylmgpbpc5q-uc.a.run.app';

// Endpoints de Autenticación
export const AUTH_ENDPOINTS = {
  REGISTER: '/users/register',
  LOGIN: '/users/login',
  FORGOT_PASSWORD: '/users/forgot-password',
  RESET_PASSWORD: '/users/reset-password',
  CHANGE_PASSWORD: '/users/change-password',
  SEND_VERIFICATION_EMAIL: '/users/send-verification-email',
  VERIFY_EMAIL: '/users/verify-email',
};

// Endpoints de Usuario
export const USER_ENDPOINTS = {
  GET_PROFILE: '/users/:id',
  UPDATE_PROFILE: '/users/:id',
  GET_FAVORITES: '/users/:id/favorites',
  ADD_FAVORITE: '/users/:id/favorites',
  REMOVE_FAVORITE: '/users/:id/favorites/:movieId',
};

// Endpoints de DNI
export const DNI_ENDPOINTS = {
  UPLOAD: '/dni/upload',
  STATUS: '/dni/status',
  DELETE: '/dni',
};

// Endpoints de Verificación Facial
export const VERIFICATION_ENDPOINTS = {
  VERIFY_FACE: '/verification/face',
  GET_STATUS: '/verification/status',
  DELETE_FACE: '/verification/face',
};

// Endpoints de Películas/Funciones
export const SHOWTIME_ENDPOINTS = {
  GET_ALL: '/showtimes',
  GET_BY_ID: '/showtimes/:id',
  GET_AVAILABLE_SEATS: '/showtimes/:id/seats',
};

// Endpoints de Tickets
export const TICKET_ENDPOINTS = {
  CREATE: '/tickets',
  GET_MY_TICKETS: '/tickets/my-tickets',
  GET_BY_ID: '/tickets/:id',
  VALIDATE: '/tickets/:id/validate',
};

// Endpoints de Checkout
export const CHECKOUT_ENDPOINTS = {
  CREATE: '/checkout-ticket',
};

// Endpoints de Candy Shop
export const CANDY_ENDPOINTS = {
  GET_PRODUCTS: '/candy-products',
  CREATE_ORDER: '/candy-orders',
  GET_MY_ORDERS: '/candy-orders/my-orders',
  GET_ORDER_BY_ID: '/candy-orders/:id',
};

// Endpoints de Pagos con MercadoPago
export const PAYMENT_ENDPOINTS = {
  CREATE_PREFERENCE: '/payments/mp/create-preference',
  WEBHOOK: '/payments/mp/webhook',
};

export const NEWS_ENDPOINTS = {
  LIST: '/news',
  DETAIL: '/news/:id',
};

// Endpoints de Admin
export const ADMIN_ENDPOINTS = {
  DASHBOARD: '/admin/dashboard',
  USERS: '/admin/users',
  TICKETS: '/admin/tickets',
  SHOWTIMES: '/admin/showtimes',
  CANDY_PRODUCTS: '/admin/candy-products',
  CANDY_ORDERS: '/admin/candy-orders',
  COUPONS: '/admin/coupons',
};

// Helper para reemplazar parámetros en URLs
export const buildUrl = (endpoint: string, params: Record<string, string>): string => {
  let url = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  return url;
};