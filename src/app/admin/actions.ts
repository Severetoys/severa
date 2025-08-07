
'use server';
/**
 * @fileOverview Server-side actions for the admin dashboard using Cloudflare D1.
 */

import { CloudflareService } from '@/lib/cloudflare';

// Cache para evitar consultas desnecessárias
let statsCache: { data: DashboardStats; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface DashboardStats {
  totalSubscribers: number;
  totalConversations: number;
  totalProducts: number;
  pendingReviews: number;
}

interface TopPage {
  id: string;
  path: string;
  count: number;
}

/**
 * Retrieves statistics for the admin dashboard from Cloudflare D1.
 * @returns A promise that resolves with the dashboard statistics.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // Check cache first
  if (statsCache && Date.now() - statsCache.timestamp < CACHE_DURATION) {
    return statsCache.data;
  }

  try {
    const cloudflareService = new CloudflareService();

    // Get total subscribers from D1
    const totalSubscribers = await cloudflareService.countSubscribers();

    // Get total conversations from D1 (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const totalConversations = await cloudflareService.countRecentConversations
      ? await cloudflareService.countRecentConversations(sevenDaysAgo)
      : 0;

    // Get total products from D1
    const totalProducts = await cloudflareService.countProducts();

    // Get pending reviews from D1
    const pendingReviews = await cloudflareService.countPendingReviews();

    const stats = {
      totalSubscribers,
      totalConversations,
      totalProducts,
      pendingReviews,
    };

    // Update cache
    statsCache = {
      data: stats,
      timestamp: Date.now()
    };

    console.log('[Dashboard] Stats retrieved from Cloudflare D1:', stats);
    return stats;
  } catch (error) {
    console.error("Error fetching dashboard stats from Cloudflare D1:", error);
    
    // Return zeroed stats on error to prevent crashing the dashboard
    const fallbackStats = {
      totalSubscribers: 0,
      totalConversations: 0,
      totalProducts: 0,
      pendingReviews: 0,
    };

    // Cache fallback stats for a shorter period
    statsCache = {
      data: fallbackStats,
      timestamp: Date.now()
    };

    return fallbackStats;
  }
}

/**
 * Invalidates the dashboard stats cache
 */
export async function invalidateStatsCache(): Promise<void> {
  statsCache = null;
}

/**
 * Retrieves the top 3 most accessed pages from Cloudflare D1.
 * @returns A promise that resolves with an array of top pages.
 */
export async function getTopPages(): Promise<TopPage[]> {
  try {
    const cloudflareService = new CloudflareService();
    const topPages = await cloudflareService.getTopPages(3);
    
    console.log('[Dashboard] Top pages retrieved from Cloudflare D1:', topPages);
    return topPages;
  } catch (error) {
    console.error("Error fetching top pages from Cloudflare D1:", error);
    return [];
  }
}
