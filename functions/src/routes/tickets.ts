import { Router } from 'express';
import { db } from '../config/firebase';
import { AuthRequest, verifyToken } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/tickets/:id
 * Obtiene el detalle de un ticket (solo el dueño lo puede ver).
 */
router.get(
  '/:id',
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, 'El id del ticket es requerido');
    }

    if (!req.user?.uid) {
      throw new ApiError(401, 'Usuario no autenticado');
    }

    const uid = req.user.uid;

    const doc = await db.collection('tickets').doc(id).get();

    if (!doc.exists) {
      throw new ApiError(404, 'Ticket no encontrado');
    }

    const data = doc.data() || {};

    // Seguridad: solo el dueño puede ver el ticket
    if ((data as any).userId !== uid) {
      throw new ApiError(403, 'No tienes permiso para ver este ticket');
    }

    return res.json({
      id: doc.id,
      ...data,
    });
  })
);

/**
 * GET /api/tickets/mine
 * Lista todos los tickets del usuario autenticado.
 */
router.get(
  '/mine',
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: any) => {
    if (!req.user?.uid) {
      throw new ApiError(401, 'Usuario no autenticado');
    }

    const uid = req.user.uid;

    let query = db.collection('tickets').where('userId', '==', uid);

    // Si existe índice, los ordenamos por fecha de creación (más recientes primero)
    try {
      // Si no tenés índice, Firestore tirará error pero lo ignoramos
      // y devolvemos sin ordenar explícitamente
      // (esto es solo un plus visual para "Mis compras")
      // @ts-ignore
      query = query.orderBy('createdAt', 'desc');
    } catch (e) {
      // no rompemos nada si falla
    }

    const snap = await query.get();

    const tickets = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({
      count: tickets.length,
      tickets,
    });
  })
);

export default router;