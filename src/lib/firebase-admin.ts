// src/lib/firebase-admin.ts
/**
 * @fileOverview Initializes and exports the Firebase Admin SDK instance.
 */

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import serviceAccount from '../../authkit-y9vjx-firebase-adminsdk-fbsvc-f73e40f978.json';

let adminApp: App | null = null;

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This function handles creating a single instance of the Firebase Admin App.
 *
 * @returns {App | null} The initialized Firebase Admin App instance or null if initialization fails.
 */
function initializeFirebaseAdmin(): App | null {
  // If an app is already initialized, return it to prevent errors.
  if (getApps().length) {
    console.log('[Admin SDK] Re-using existing Firebase Admin instance.');
    return getApps()[0];
  }

  try {
    const app = initializeApp({
      credential: cert(serviceAccount as any),
      databaseURL: "https://authkit-y9vjx-default-rtdb.firebaseio.com"
    });
    console.log('[Admin SDK] Firebase Admin SDK initialized successfully with service account.');
    return app;

  } catch (error: any) {
    console.error('[Admin SDK] Error during Firebase Admin initialization:', error);
    console.log('[Admin SDK] Firebase Admin SDK initialization failed.');
    return null;
  }
}

// Initialize the app and store the instance.
adminApp = initializeFirebaseAdmin();

export { adminApp };
