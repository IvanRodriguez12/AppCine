// functions/src/models/coupon.ts
export type CouponScope = 'tickets' | 'candyshop' | 'both';
export type CouponMode = 'fixed' | 'percent' | '2x1' | '3x2';

export interface Coupon {
  id: string;           // id en Firestore (opcional para el front)
  code: string;         // código, ej: "2X1TICKETS"
  scope: CouponScope;   // tickets | candyshop | both
  mode: CouponMode;     // fixed | percent | 2x1 | 3x2

  // Para fixed/percent
  value?: number;       // ej: 2000 (fixed) o 15 (percent)

  // Para promos tipo NxM (2x1, 3x2)
  buyQuantity?: number; // ej: 2
  payQuantity?: number; // ej: 1

  premiumOnly: boolean; // true = solo usuarios premium

  // Reglas adicionales (opcionales)
  minAmount?: number;   // monto mínimo de compra
  maxDiscount?: number; // tope de descuento

  active: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  validFrom?: FirebaseFirestore.Timestamp;
  validTo?: FirebaseFirestore.Timestamp;
}