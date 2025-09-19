// Fix: Switched to firebase/compat/app to resolve issues with modular imports not being found.
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import { getDatabase, Database } from "firebase/database";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB6YR3oa9G7fKV9obY1FnVXYg9wHclAqOM",
  authDomain: "sez-v1.firebaseapp.com",
  databaseURL: "https://sez-v1-default-rtdb.firebaseio.com",
  projectId: "sez-v1",
  storageBucket: "sez-v1.firebasestorage.app",
  messagingSenderId: "778513275768",
  appId: "1:778513275768:web:e68f4a88ff3e488820c68d",
  measurementId: "G-6RZPWMQZB4"
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
