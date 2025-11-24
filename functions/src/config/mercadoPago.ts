// functions/src/config/mercadoPago.ts
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const accessToken = process.env.MP_ACCESS_TOKEN;

console.log('MP_ACCESS_TOKEN (parcial):', accessToken?.slice(0, 10));

if (!accessToken) {
  console.warn(
    'MP_ACCESS_TOKEN no está definido. Configura MP_ACCESS_TOKEN en tu .env'
  );
}

export const mpClient = new MercadoPagoConfig({
  accessToken: accessToken || '',
  options: {
    timeout: 5000,
  },
});

export const mpPreference = new Preference(mpClient);
export const mpPayment = new Payment(mpClient);