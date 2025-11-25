import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBwnaRWFhf-oDcrDzY9pS4YhdRtAnTwhv0",
  authDomain: "cineapp-3dy2.firebaseapp.com",
  projectId: "cineapp-3dy2",
  storageBucket: "cineapp-3dy2.firebasestorage.app",
  messagingSenderId: "981414684780",
  appId: "1:981414684780:web:f916654eb23f2c0f689049"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;