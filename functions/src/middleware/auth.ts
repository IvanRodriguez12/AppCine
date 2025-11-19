import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

// Extender Request para incluir user
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

/**
 * Middleware para verificar el token de Firebase Auth
 */
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'No autorizado',
        message: 'Token no proporcionado'
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    // Verificar token JWT
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    
    res.status(401).json({
      error: 'No autorizado',
      message: 'Token inválido o expirado'
    });
    return;
  }
};

/**
 * Middleware para verificar que el usuario sea admin
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'No autorizado',
        message: 'Debe estar autenticado'
      });
      return;
    }

    // Verificar rol de admin en Firestore
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json({
        error: 'Usuario no encontrado'
      });
      return;
    }

    const userData = userDoc.data();
    
    if (userData?.role !== 'admin') {
      res.status(403).json({
        error: 'Prohibido',
        message: 'Requiere permisos de administrador'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error verificando admin:', error);
    res.status(500).json({
      error: 'Error verificando permisos'
    });
    return;
  }
};

/**
 * Middleware opcional - continúa aunque no haya token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'user'
      };
    }
    
    next();
  } catch (error) {
    // Si hay error, simplemente continúa sin usuario
    next();
  }
};