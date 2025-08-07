// Compatibility layer - Firebase replaced with Cloudflare services
// This file maintains exports to prevent build errors during migration
//
// SECURITY UPDATE: All Firebase configuration values have been moved to environment variables
// to prevent exposure of sensitive data in the repository. Create a .env.local file with your
// actual Firebase configuration values (see .env.local.example for the required format).
// The .env.local file is automatically ignored by Git and will not be committed.

import { 
  db as cloudflareDb, 
  storage as cloudflareStorage, 
  auth as cloudflareAuth,
  realtime as cloudflareRealtime,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from './cloudflare';

console.warn('[Migration] Firebase has been replaced with Cloudflare services.');

// Firebase configuration using environment variables for security
// All sensitive values are now loaded from environment variables
// Create a .env.local file with these values (see .env.local.example)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Export Cloudflare services with Firebase-compatible names
export const app = null; // Not needed for Cloudflare
export const auth = cloudflareAuth;
export const db = cloudflareDb;
export const storage = cloudflareStorage;
export const database = cloudflareRealtime;

// Export utility functions
export { serverTimestamp, arrayUnion, arrayRemove, increment };

// Mock query functions for compatibility
export const query = (...args: any[]) => {
  console.log('[Migration] Mock query function called');
  return { docs: [], size: 0 };
};

export const orderByChild = (field: string) => {
  console.log('[Migration] Mock orderByChild called with:', field);
  return query;
};

export const ref = (path: string) => {
  console.log('[Migration] Mock ref called with:', path);
  return { path };
};

export const off = (ref: any, callback?: any) => {
  console.log('[Migration] Mock off called');
};

export { firebaseConfig };

