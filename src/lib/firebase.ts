import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD7SEb5SULMW99RHzG9cD8SRqzot3JuCvE',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'suren-a2116.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'suren-a2116',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'suren-a2116.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '774779079007',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:774779079007:web:a8eb7b276e547b340cceea',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-N211ZNJXGB',
};

// Initialize Firebase client app (singleton)
export function getFirebaseAuth() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  return getAuth(app);
}
