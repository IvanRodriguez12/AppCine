import * as admin from 'firebase-admin';

// Inicializar Firebase Admin una sola vez
if (!admin.apps.length) {
  admin.initializeApp();
}

// Exportar instancias para usar en toda la app
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export default admin;