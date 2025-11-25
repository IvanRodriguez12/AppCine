import * as dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Inicializar Firebase PRIMERO
import { db } from './config/firebase';

// Importar rutas
import checkoutTicketRoutes from './routes/checkoutTicket';
import dniRoutes from './routes/dni';
import showtimeRoutes from './routes/showtimes';
import ticketRoutes from './routes/tickets';
import userRoutes from './routes/users';
import verificationRoutes from './routes/verification';
import candyProductsRoutes from './routes/candyProducts';
import candyOrdersRoutes from './routes/candyOrders';
import paymentsMpRoutes from './routes/paymentsMP';

// 🆕 Importar rutas de admin
import adminUsersRoutes from './routes/admin/users';
import adminCandyOrdersRoutes from './routes/admin/candyOrders';
import adminDashboardRoutes from './routes/admin/dashboard';
import adminCandyProductsRoutes from './routes/admin/candyProducts';
import adminShowtimesRoutes from './routes/admin/showtimes';
import adminTicketsRoutes from './routes/admin/tickets';
import adminCouponsRoutes from './routes/admin/coupons';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

// Crear app Express
const app = express();

// Middlewares globales
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'CineApp API'
  });
});

// Rutas públicas/usuario
app.use('/users', userRoutes);
app.use('/dni', dniRoutes);
app.use('/verification', verificationRoutes);
app.use('/showtimes', showtimeRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/checkout-ticket', checkoutTicketRoutes);
app.use('/api/candy-products', candyProductsRoutes);
app.use('/api/candy-orders', candyOrdersRoutes);
app.use('/api/payments/mp', paymentsMpRoutes);

// 🆕 Rutas de admin (requieren autenticación + rol admin)
app.use('/admin/users', adminUsersRoutes);
app.use('/admin/dashboard', adminDashboardRoutes);
app.use('/admin/candy-orders', adminCandyOrdersRoutes);
app.use('/admin/candy-products', adminCandyProductsRoutes);
app.use('/admin/showtimes', adminShowtimesRoutes);
app.use('/admin/tickets', adminTicketsRoutes);
app.use('/admin/coupons', adminCouponsRoutes);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.originalUrl 
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Exportar como Cloud Function v2
export const api = onRequest(app);

// Función triggered por Firestore
export const onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userData = event.data?.data();
  const userId = event.params.userId;
  
  console.log(`Nuevo usuario creado: ${userId}`, userData);
});

// Función programada (cada día a las 00:00)
export const dailyCleanup = onSchedule({
  schedule: '0 0 * * *',
  timeZone: 'America/Argentina/Buenos_Aires'
}, async (event) => {
  console.log('Ejecutando limpieza diaria...');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const expiredBookings = await db.collection('bookings')
    .where('status', '==', 'pending')
    .where('createdAt', '<', yesterday)
    .get();
  
  const batch = db.batch();
  expiredBookings.docs.forEach((doc) => {
    batch.update(doc.ref, { status: 'expired' });
  });
  
  await batch.commit();
  console.log(`${expiredBookings.size} reservas expiradas actualizadas`);
});