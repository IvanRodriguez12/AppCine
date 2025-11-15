import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para loggear todas las requests
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Log cuando la respuesta termina
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    console.log({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
};