import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/errorHandler';
import { reservarAsientos } from '../services/firestoreTickets';

const router = Router();

router.post(
  '/',
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { showtimeId, asientos, total, metodoPago } = req.body;

    // Validaciones básicas
    if (!showtimeId || !Array.isArray(asientos) || asientos.length === 0) {
      throw new ApiError(400, 'showtimeId y asientos son requeridos');
    }

    if (typeof total !== 'number' || total <= 0) {
      throw new ApiError(400, 'total debe ser un número mayor a 0');
    }

    if (!req.user?.uid) {
      throw new ApiError(401, 'Usuario no autenticado');
    }

    const userId = req.user.uid;

    const { ticketId } = await reservarAsientos(
      showtimeId,
      userId,
      asientos,
      total,
      metodoPago || 'no-especificado'
    );

    // Generamos un token simple con info del ticket
    const ticketToken = Buffer.from(
      JSON.stringify({
        ticketId,
        showtimeId,
        userId,
        timestamp: Date.now()
      })
    ).toString('base64');

    // URL de QR usando servicio externo (sin instalar librerías)
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
      ticketToken
    )}&size=300x300`;

    return res.status(201).json({
      message: 'Ticket generado correctamente',
      ticketId,
      ticketToken,
      qrCode
    });
  })
);

export default router;