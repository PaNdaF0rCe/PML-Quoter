import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const clean = (s: string) => s.charCodeAt(0) === 0xfeff ? s.slice(1) : s

const firebaseConfig = {
  apiKey: clean(import.meta.env.VITE_FIREBASE_API_KEY ?? ''),
  authDomain: clean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? ''),
  projectId: clean(import.meta.env.VITE_FIREBASE_PROJECT_ID ?? ''),
  storageBucket: clean(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? ''),
  messagingSenderId: clean(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? ''),
  appId: clean(import.meta.env.VITE_FIREBASE_APP_ID ?? ''),
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
