// Fix: Switched to firebase/compat/app to resolve issues with modular imports not being found.
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import { getDatabase, Database } from "firebase/database";

// Firebase config — read from Vite environment variables when available.
// On Vercel we will set VITE_FIREBASE_* variables in the project settings.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB6YR3oa9G7fKV9obY1FnVXYg9wHclAqOM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sez-v1.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://sez-v1-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sez-v1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sez-v1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "778513275768",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:778513275768:web:e68f4a88ff3e488820c68d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-6RZPWMQZB4"
};

let db: Database | null = null;
let dbError: string | null = null;

// Initialize Firebase safely
try {
  // Fix: Use the v8-compat syntax for initialization to avoid module export errors.
  const app = firebase.apps.length === 0 ? firebase.initializeApp(firebaseConfig) : firebase.app();
  db = getDatabase(app);
} catch (error: any) {
  console.error("Firebase Initialization Error:", error);
  // Provide a more user-friendly error message that guides the user
  dbError = `Service database is not available. Please ensure the Realtime Database is enabled in your Firebase project console. Details: ${error.message}`;
}

// Export a function that returns the database instance or an error
export const initializeDb = (): { db: Database | null; error: string | null } => {
  return { db, error: dbError };
};
