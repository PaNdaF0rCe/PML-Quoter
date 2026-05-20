import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyCCk45YucPZQ-f5nmbUe-GP3rY1GwmSAnk',
  authDomain: 'pml-quoter.firebaseapp.com',
  projectId: 'pml-quoter',
  storageBucket: 'pml-quoter.firebasestorage.app',
  messagingSenderId: '375158026666',
  appId: '1:375158026666:web:e68168815c216fbc797bd3',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
