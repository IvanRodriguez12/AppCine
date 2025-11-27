// types/coupon.ts
export type CouponScope = 'tickets' | 'candyshop' | 'both';
export type CouponMode = 'fixed' | 'percent' | '2x1' | '3x2';

// Tipo para el FRONTEND - usa strings para fechas
export interface Coupon {
  id: string;
  code: string;
  scope: CouponScope;
  mode: CouponMode;
  value?: number;
  buyQuantity?: number;
  payQuantity?: number;
  premiumOnly: boolean;
  minAmount?: number;
  maxDiscount?: number;
  active: boolean;
  createdAt: string; // ISO string
  validFrom?: string; // ISO string
  validTo?: string; // ISO string
}

// Para uso interno en componentes
export interface CouponWithJSDate extends Coupon {
  _createdAtJS?: Date;
  _validFromJS?: Date;
  _validToJS?: Date;
  _isExpired?: boolean;
  _isActive?: boolean;
}