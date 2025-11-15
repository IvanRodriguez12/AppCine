import { Request, Response, NextFunction } from 'express';

// Clase personalizada para errores de la API
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

// Middleware de manejo de errores
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error capturado:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Si es un ApiError personalizado
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode
    });
  }

  // Errores específicos de Firebase
  if (err.message.includes('auth/')) {
    return res.status(401).json({
      error: 'Error de autenticación',
      message: err.message
    });
  }

  if (err.message.includes('permission-denied')) {
    return res.status(403).json({
      error: 'Permisos denegados',
      message: 'No tienes permisos para realizar esta acción'
    });
  }

  // Error genérico del servidor
  return res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
};

// Wrapper para funciones asíncronas
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};