// utils/couponUtils.ts
import { Coupon, CouponWithJSDate } from '../types/coupon';

/**
 * Convierte un cupón para uso en el frontend con fechas JS
 */
export const enhanceCouponForFrontend = (coupon: Coupon): CouponWithJSDate => {
  const now = new Date();
  const validTo = coupon.validTo ? new Date(coupon.validTo) : null;
  
  return {
    ...coupon,
    _createdAtJS: coupon.createdAt ? new Date(coupon.createdAt) : undefined,
    _validFromJS: coupon.validFrom ? new Date(coupon.validFrom) : undefined,
    _validToJS: validTo || undefined,
    _isExpired: validTo ? validTo < now : false,
    _isActive: coupon.active && (!validTo || validTo >= now)
  };
};

/**
 * Formatea el valor del cupón para mostrar
 */
export const formatCouponValue = (coupon: Coupon): string => {
  switch (coupon.mode) {
    case 'fixed':
      return `$${coupon.value?.toLocaleString()}`;
    case 'percent':
      return `${coupon.value}%`;
    case '2x1':
      return '2x1';
    case '3x2':
      return '3x2';
    default:
      return 'N/A';
  }
};

/**
 * Obtiene el texto descriptivo del cupón
 */
export const getCouponDescription = (coupon: Coupon): string => {
  const scopeText = {
    tickets: 'en tickets',
    candyshop: 'en golosinas', 
    both: 'en tickets y golosinas'
  }[coupon.scope];

  const modeText = formatCouponValue(coupon);
  
  return `${modeText} ${scopeText}${coupon.premiumOnly ? ' (Premium)' : ''}`;
};