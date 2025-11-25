import * as admin from 'firebase-admin';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: 'cineapp-3dy2.firebasestorage.app' // Actualiza esto
  });
  console.log('✅ Firebase Admin initialized');
}

// Exportar instancias para usar en toda la app
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export default admin;