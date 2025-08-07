// Compatibility layer - Firebase replaced with Cloudflare services
// This file maintains exports to prevent build errors during migration

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

// Mock Firebase configuration (kept for reference)
const firebaseConfig = {
  apiKey: "AIzaSyC7yaXjEFWFORvyLyHh1O5SPYjRCzptTg8",
  authDomain: "authkit-y9vjx.firebaseapp.com",
  databaseURL: "https://authkit-y9vjx-default-rtdb.firebaseio.com",
  projectId: "authkit-y9vjx",
  storageBucket: "authkit-y9vjx.firebasestorage.app",
  messagingSenderId: "308487499277",
  appId: "1:308487499277:web:3fde6468b179432e9f2f44",
  measurementId: "G-XKJWPXDPZS"
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

