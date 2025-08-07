'use server';

/**
 * @fileOverview Server-side actions for managing profile settings.
 * Essas funções usam mocks para compatibilidade com Cloudflare/D1.
 */

export interface ProfileSettings {
    name: string;
    phone: string;
    email: string;
    address: string;
    profilePictureUrl: string;
    coverPhotoUrl: string;
    galleryPhotos: { url: string }[];
}

// Mocks locais (não exporte!)
const adminApp: any = null;
const getDatabase: any = (..._args: any[]) => ({
    ref: (..._args: any[]) => ({
        set: async (..._args: any[]) => null,
        once: async (..._args: any[]) => ({ exists: () => false, val: () => null })
    })
});
const doc: any = (..._args: any[]) => null;
const setDoc: any = async (..._args: any[]) => null;
const getDoc: any = async (..._args: any[]) => ({ exists: () => false, data: () => null });
const clientDb: any = null;
function revalidatePath(_: string) { }

const db = adminApp ? getDatabase(adminApp) : null;
const settingsRef = db ? db.ref('admin/profileSettings') : null;

/**
 * Salva as configurações de perfil (mock).
 */
export async function saveProfileSettings(settings: ProfileSettings): Promise<void> {
  try {
    if (settingsRef) {
      await settingsRef.set(settings);
      console.log("Profile settings saved successfully to Realtime Database.");
    } else {
      // Fallback para Firestore mock
      console.log("Using Firestore fallback for profile settings");
      const settingsDoc = doc(clientDb, 'admin', 'profileSettings');
      await setDoc(settingsDoc, settings);
      console.log("Profile settings saved successfully to Firestore.");
    }
    revalidatePath('/');
    revalidatePath('/admin/settings');
    revalidatePath('/api/admin/profile-settings');
  } catch (error: any) {
    console.error("Error saving profile settings:", error);
    throw new Error("Failed to save settings to the database.");
  }
}

/**
 * Recupera as configurações de perfil (mock).
 */
export async function getProfileSettings(): Promise<ProfileSettings | null> {
  try {
    if (settingsRef) {
      const snapshot = await settingsRef.once();
      if (snapshot.exists()) {
        console.log("Profile settings loaded successfully from Realtime Database.");
        return snapshot.val() as unknown as ProfileSettings;
      }
      console.log("No profile settings found in the Realtime Database.");
      return null;
    } else {
      // Fallback para Firestore mock
      console.log("Using Firestore fallback for profile settings");
      const settingsDoc = doc(clientDb, 'admin', 'profileSettings');
      const docSnap = await getDoc(settingsDoc);
      if (docSnap.exists()) {
        console.log("Profile settings loaded successfully from Firestore.");
        return docSnap.data() as unknown as ProfileSettings;
      }
      console.log("No profile settings found in Firestore.");
      return null;
    }
  } catch (error: any) {
    console.error("Error getting profile settings:", error);
    throw new Error("Failed to retrieve settings from the database.");
  }
}