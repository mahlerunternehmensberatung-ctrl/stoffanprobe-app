// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB09E6YIwZN85fEWzDtFkcOkw3t6tvg278",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "stoffanprobe-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "stoffanprobe-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "stoffanprobe-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "161327831192",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:161327831192:web:ec748acf72fbf06288d8ed",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HL9EV45ZFK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (nur im Browser)
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
export default app;

