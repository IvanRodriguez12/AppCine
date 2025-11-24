// functions/src/services/coupons.ts
import { db } from '../config/firebase';
import { Coupon } from '../models/coupon';

interface ValidateCouponInput {
  userId: string;
  purchaseType: 'tickets' | 'candyshop';
  code: string;
}

interface ValidateCouponOutput {
  valid: boolean;
  reason?: string;
  coupon?: Coupon;
}

async function getUserIsPremium(userId: string): Promise<boolean> {
  // Ajustá esta función dependiendo de cómo guardés el estado premium
  // Ejemplos posibles:
  //  - users/{uid}.isPremium === true
  //  - users/{uid}.accountLevel === 'premium'
  const userSnap = await db.collection('users').doc(userId).get();
  if (!userSnap.exists) return false;

  const data = userSnap.data() || {};

  // Intentamos múltiples nombres de campo para ser tolerantes
  if (data.isPremium === true) return true;
  if (data.accountLevel === 'premium') return true;
  if (data.subscriptionStatus === 'active') return true;

  return false;
}

export async function findCouponByCode(
  code: string
): Promise<Coupon | null> {
  const upperCode = code.trim().toUpperCase();

  const snap = await db
    .collection('coupons')
    .where('code', '==', upperCode)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data() as any;

  const coupon: Coupon = {
    id: doc.id,
    code: data.code,
    scope: data.scope,
    mode: data.mode,
    value: data.value,
    buyQuantity: data.buyQuantity,
    payQuantity: data.payQuantity,
    premiumOnly: data.premiumOnly ?? false,
    minAmount: data.minAmount,
    maxDiscount: data.maxDiscount,
    active: data.active ?? true,
    createdAt: data.createdAt ?? doc.createTime!,
    validFrom: data.validFrom,
    validTo: data.validTo,
  };

  return coupon;
}

export async function validateCouponForUser(
  input: ValidateCouponInput
): Promise<ValidateCouponOutput> {
  const { userId, purchaseType, code } = input;

  if (!code || !code.trim()) {
    return { valid: false, reason: 'Debe ingresar un código de cupón' };
  }

  const coupon = await findCouponByCode(code);
  if (!coupon) {
    return { valid: false, reason: 'Cupón no encontrado' };
  }

  if (!coupon.active) {
    return { valid: false, reason: 'El cupón no está activo' };
  }

  // Validar tipo de compra
  if (
    coupon.scope !== 'both' &&
    coupon.scope !== purchaseType
  ) {
    return {
      valid: false,
      reason: 'El cupón no aplica para este tipo de compra',
    };
  }

  // Validar fechas
  const now = new Date();
  if (coupon.validFrom && coupon.validFrom.toDate() > now) {
    return {
      valid: false,
      reason: 'El cupón aún no está disponible',
    };
  }
  if (coupon.validTo && coupon.validTo.toDate() < now) {
    return {
      valid: false,
      reason: 'El cupón ya expiró',
    };
  }

  // Validar premiumOnly
  if (coupon.premiumOnly) {
    const isPremium = await getUserIsPremium(userId);
    if (!isPremium) {
      return {
        valid: false,
        reason: 'Este cupón es exclusivo para usuarios premium',
      };
    }
  }

  // (Opcional) acá podrías chequear límites de uso por usuario o globales

  return { valid: true, coupon };
}