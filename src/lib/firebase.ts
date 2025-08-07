// FIRST: Disable App Check before any Firebase imports
import './disable-app-check';

// Import the functions you need from the SDKs
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, query, orderByChild, ref, off } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage }from "firebase/storage";

// CRITICAL: Disable App Check completely before any Firebase initialization
if (typeof window !== 'undefined') {
  // Set the debug token BEFORE any Firebase initialization
  (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  
  // Also disable in different potential locations
  if (typeof self !== 'undefined') {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  // Set in localStorage as well (some versions check here)
  try {
    localStorage.setItem('FIREBASE_APPCHECK_DEBUG_TOKEN', 'true');
  } catch (e) {
    // Ignore localStorage errors in case it's not available
  }
  
  console.log('[Firebase] App Check disabled with debug token');
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);


export { app, firebaseConfig, db, auth, database, storage, query, orderByChild, ref, off };

