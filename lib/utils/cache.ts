/**
 * SIMPLE DATA CACHE
 * ==============================================================================
 * Client-side cache with stale-while-revalidate pattern
 * - Stores data with timestamp
 * - Returns cached data if fresh (within maxAge)
 * - Returns stale data but triggers background refresh if expired
 * ==============================================================================
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    userId: string;
}

// In-memory cache store
const cacheStore: Map<string, CacheEntry<unknown>> = new Map();

// Default cache max age: 5 minutes
const DEFAULT_MAX_AGE = 5 * 60 * 1000;

/**
 * Get cached data if available and fresh
 */
export function getCached<T>(
    key: string,
    userId: string,
    maxAge: number = DEFAULT_MAX_AGE
): { data: T; isStale: boolean } | null {
    const entry = cacheStore.get(key) as CacheEntry<T> | undefined;

    if (!entry || entry.userId !== userId) {
        return null;
    }

    const age = Date.now() - entry.timestamp;
    const isStale = age > maxAge;

    return { data: entry.data, isStale };
}

/**
 * Set data in cache
 */
export function setCache<T>(key: string, data: T, userId: string): void {
    cacheStore.set(key, {
        data,
        timestamp: Date.now(),
        userId,
    });
}

/**
 * Clear specific cache key
 */
export function clearCache(key: string): void {
    cacheStore.delete(key);
}

/**
 * Clear all cache for a user
 */
export function clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    cacheStore.forEach((entry, key) => {
        if (entry.userId === userId) {
            keysToDelete.push(key);
        }
    });
    keysToDelete.forEach(key => cacheStore.delete(key));
}

/**
 * Clear entire cache
 */
export function clearAllCache(): void {
    cacheStore.clear();
}

// Cache keys
export const CACHE_KEYS = {
    MATERIALS_LIST: 'materials_list',
    FOLDERS: 'folders',
    TRANSCRIPTS: 'transcripts',
} as const;
