import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import express from 'express';
import cors from 'cors';

// Inicializar Firebase PRIMERO
import { db } from './config/firebase';

// Importar rutas
import userRoutes from './routes/users';
import dniRoutes from './routes/dni';
import verificationRoutes from './routes/verification';
import movieRoutes from './routes/movies';
import bookingRoutes from './routes/bookings';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

// Crear app Express
const app = express();

// Middlewares globales
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' })); // Aumentar límite para base64
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'CineApp API'
  });
});

// Rutas
app.use('/users', userRoutes);
app.use('/dni', dniRoutes);
app.use('/movies', movieRoutes);
app.use('/bookings', bookingRoutes);
app.use('/verification', verificationRoutes);

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