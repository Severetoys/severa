// Mock twitter photo storage service for Cloudflare compatibility
export interface TwitterPhoto {
  id: string;
  tweetId: string;
  mediaKey: string;
  username: string;
  url: string;
  storagePath: string;
  createdAt: string;
}

export interface PhotoStorageStats {
  totalPhotos: number;
  totalUsers: number;
  storageUsed: string;
}

// Mock implementations for compatibility
export async function getSavedPhotosFromUser(username: string, limit: number = 20): Promise<TwitterPhoto[]> {
  console.log(`[Mock] Getting photos for user: ${username}, limit: ${limit}`);
  return [];
}

export async function getAllSavedPhotos(limit: number = 20): Promise<TwitterPhoto[]> {
  console.log(`[Mock] Getting all photos, limit: ${limit}`);
  return [];
}

export async function getPhotoStorageStats(): Promise<PhotoStorageStats> {
  console.log('[Mock] Getting photo storage stats');
  return {
    totalPhotos: 0,
    totalUsers: 0,
    storageUsed: '0 MB'
  };
}

export async function getPhotoByTweetId(tweetId: string, mediaKey: string): Promise<TwitterPhoto | null> {
  console.log(`[Mock] Getting photo by tweet ID: ${tweetId}, media key: ${mediaKey}`);
  return null;
}