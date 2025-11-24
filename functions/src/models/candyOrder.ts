// functions/src/models/candyOrder.ts

export interface CandyOrderItem {
  productId: string;
  nombre: string;
  tamanio: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export type CandyPaymentStatus = 'PENDIENTE' | 'PAGADO' | 'CANCELADO';
export type CandyRedeemStatus = 'PENDIENTE' | 'CANJEADO';

export interface CandyOrder {
  id?: string;
  userId: string;

  items: CandyOrderItem[];

  subtotal: number;
  descuento: number;
  feeServicio: number;
  total: number;

  paymentMethod: 'mercadopago' | 'efectivo';
  paymentStatus: CandyPaymentStatus;
  paymentId?: string;          // id de pago de Mercado Pago 

  redeemCode: string;          // código que se muestra al usuario para canjear
  redeemStatus: CandyRedeemStatus;
  redeemedAt?: Date | null;

  createdAt: Date;
}