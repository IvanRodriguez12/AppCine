import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBuHaIFhr-dDorGzr9pS4ThdAfUnTuhwd",
  authDomain: "cinapp-33a5.firebaseapp.com",
  projectId: "cinapp-33a5",
  storageBucket: "cinapp-33a5.firebasestorage.app",
  messagingSenderId: "981414684768",
  appId: "1:981414684768:web:f316c54abd23f2c8f689d49"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;