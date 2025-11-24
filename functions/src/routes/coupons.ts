// functions/src/routes/coupons.ts
import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { validateCouponForUser } from '../services/coupons';

const router = Router();

/**
 * POST /api/coupons/validate
 *
 * Body:
 * {
 *   "code": "2X1CANDY",
 *   "purchaseType": "tickets" | "candyshop"
 * }
 *
 * Requiere auth (Bearer token Firebase).
 */
router.post('/validate', verifyToken, async (req, res) => {
  try {
    const { code, purchaseType } = req.body;

    if (!purchaseType || !['tickets', 'candyshop'].includes(purchaseType)) {
      return res.status(400).json({
        error: 'purchaseType debe ser "tickets" o "candyshop"',
      });
    }

    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const result = await validateCouponForUser({
      userId,
      purchaseType,
      code,
    });

    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        reason: result.reason,
      });
    }

    return res.status(200).json({
      valid: true,
      coupon: result.coupon,
    });
  } catch (error) {
    console.error('Error validando cupón:', error);
    return res.status(500).json({
      valid: false,
      error: 'Error interno validando el cupón',
    });
  }
});

export default router;