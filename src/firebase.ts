import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBHSzGV6GFM8AzsWcTTOX3Qq1L-3lJKCL0",
  authDomain: "anik-fb-create.firebaseapp.com",
  databaseURL: "https://anik-fb-create-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "anik-fb-create",
  storageBucket: "anik-fb-create.firebasestorage.app",
  messagingSenderId: "286831116015",
  appId: "1:286831116015:web:99bcc43a7011bc93efa51a",
  measurementId: "G-K54VNB4K73"
};

export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
};

export const app = isFirebaseConfigured() ? initializeApp(firebaseConfig) : null;
export const db = app ? getDatabase(app) : null;
