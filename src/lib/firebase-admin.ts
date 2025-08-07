// Compatibility layer for firebase-admin replacement
// Provides mock admin functionality for Cloudflare deployment

console.warn('[Migration] Firebase Admin has been replaced with Cloudflare services.');

// Mock admin app
export const adminApp = null;

// Mock admin exports to prevent build errors
export const getDatabase = () => ({
  ref: (path: string) => ({
    once: async () => ({ val: () => null }),
    set: async (data: any) => console.log('[Mock Admin] Set:', path, data),
    push: async (data: any) => console.log('[Mock Admin] Push:', path, data),
    remove: async () => console.log('[Mock Admin] Remove:', path),
  }),
});

export const getFirestore = () => ({
  collection: (name: string) => ({
    add: async (data: any) => ({ id: `mock_${Date.now()}` }),
    get: async () => ({ docs: [], size: 0 }),
    doc: (id: string) => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async (data: any) => console.log('[Mock Admin] Firestore set:', data),
      update: async (data: any) => console.log('[Mock Admin] Firestore update:', data),
      delete: async () => console.log('[Mock Admin] Firestore delete'),
    }),
  }),
  doc: (path: string) => ({
    get: async () => ({ exists: false, data: () => null }),
    set: async (data: any) => console.log('[Mock Admin] Doc set:', data),
    update: async (data: any) => console.log('[Mock Admin] Doc update:', data),
    delete: async () => console.log('[Mock Admin] Doc delete'),
  }),
});

export const getStorage = () => ({
  bucket: (name?: string) => ({
    file: (path: string) => ({
      save: async (data: any) => console.log('[Mock Admin] Storage save:', path),
      delete: async () => console.log('[Mock Admin] Storage delete:', path),
      getSignedUrl: async () => [`https://mock-storage.example.com/${path}`],
      exists: async () => [false],
    }),
  }),
});

// Mock FieldValue
export const FieldValue = {
  serverTimestamp: () => new Date(),
  arrayUnion: (...items: any[]) => items,
  arrayRemove: (...items: any[]) => items,
  increment: (value: number) => value,
  delete: () => null,
};

export default {
  adminApp,
  getDatabase,
  getFirestore,
  getStorage,
  FieldValue
};

console.log('🔧 Firebase Admin compatibility layer loaded');
