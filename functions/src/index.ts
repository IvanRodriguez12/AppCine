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

// Importar rutas de admin
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
app.use('/tickets', ticketRoutes);
app.use('/checkout-ticket', checkoutTicketRoutes);
app.use('/candy-products', candyProductsRoutes);
app.use('/candy-orders', candyOrdersRoutes);
app.use('/payments/mp', paymentsMpRoutes);

// Rutas de admin (requieren autenticación + rol admin)
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

// ========================================
// EXPORTAR COMO CLOUD FUNCTIONS V2 (firebase-functions v5+)
// ========================================

// API principal (pública - sin autenticación requerida)
export const api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '1GiB',
    cors: true,
    invoker: 'public' // Permite acceso público sin autenticación
  },
  app
);

// Función triggered por Firestore (renombrada para evitar conflictos)
export const onUserCreatedV2 = onDocumentCreated(
  {
    document: 'users/{userId}',
    region: 'us-central1'
  },
  async (event) => {
    const userData = event.data?.data();
    const userId = event.params.userId;
    
    console.log(`✅ Nuevo usuario creado: ${userId}`, userData);
    
    // Aquí puedes agregar lógica adicional:
    // - Enviar email de bienvenida
    // - Crear documento relacionado
    // - Actualizar métricas
  }
);

// Función programada (cada día a las 00:00 Argentina) (renombrada para evitar conflictos)
export const dailyCleanupV2 = onSchedule(
  {
    schedule: '0 0 * * *',
    timeZone: 'America/Argentina/Buenos_Aires',
    region: 'us-central1',
    memory: '512MiB'
  },
  async (event) => {
    console.log('🧹 Ejecutando limpieza diaria...');
    
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Buscar reservas expiradas
      const expiredBookings = await db.collection('bookings')
        .where('status', '==', 'pending')
        .where('createdAt', '<', yesterday)
        .get();
      
      if (expiredBookings.empty) {
        console.log('✅ No hay reservas expiradas');
        return;
      }
      
      // Actualizar en lote
      const batch = db.batch();
      expiredBookings.docs.forEach((doc) => {
        batch.update(doc.ref, { 
          status: 'expired',
          expiredAt: new Date()
        });
      });
      
      await batch.commit();
      console.log(`✅ ${expiredBookings.size} reservas expiradas actualizadas`);
    } catch (error) {
      console.error('❌ Error en limpieza diaria:', error);
      throw error;
    }
  }
);