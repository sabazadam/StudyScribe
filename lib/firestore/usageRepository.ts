/**
 * USAGE REPOSITORY
 * ==============================================================================
 * Track daily usage per user for quota enforcement
 * Stores usage records in Firestore: usage/{userId}/daily/{date}
 * ==============================================================================
 */

import { adminDb } from '@/lib/firebase/adminConfig';
import admin from '@/lib/firebase/adminConfig';

// ==============================================================================
// TYPES
// ==============================================================================

export interface DailyUsage {
  userId: string;
  date: string; // YYYY-MM-DD format
  materialsGenerated: number;
  imagesGenerated: number;
  quizzesCreated: number;
  lastUpdated: any; // Firestore Timestamp
}

export type UsageType = 'materials' | 'images' | 'quizzes';

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get Firestore document path for user's daily usage
 */
function getDailyUsagePath(userId: string, date?: string): string {
  const targetDate = date || getTodayDate();
  return `usage/${userId}/daily/${targetDate}`;
}

/**
 * Initialize empty usage record
 */
function createEmptyUsage(userId: string, date: string): DailyUsage {
  return {
    userId,
    date,
    materialsGenerated: 0,
    imagesGenerated: 0,
    quizzesCreated: 0,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  };
}

// ==============================================================================
// USAGE TRACKING FUNCTIONS
// ==============================================================================

/**
 * Get today's usage for a user
 * Creates empty record if doesn't exist
 *
 * @param userId - User ID
 * @returns Today's usage counts
 */
export async function getTodayUsage(userId: string): Promise<DailyUsage> {
  try {
    const today = getTodayDate();
    const usagePath = getDailyUsagePath(userId);
    const usageRef = adminDb.doc(usagePath);

    const usageDoc = await usageRef.get();

    if (usageDoc.exists) {
      return usageDoc.data()! as DailyUsage;
    }

    // Create empty usage record
    const emptyUsage = createEmptyUsage(userId, today);
    await usageRef.set(emptyUsage);

    return emptyUsage;
  } catch (error) {
    console.error('[UsageRepository] Failed to get today usage:', error);
    throw new Error('Failed to retrieve usage data');
  }
}

/**
 * Increment materials generated count
 * Uses Firestore transaction for atomic increment
 *
 * @param userId - User ID
 * @returns Updated count
 */
export async function incrementMaterialsCount(userId: string): Promise<number> {
  try {
    const usagePath = getDailyUsagePath(userId);
    const usageRef = adminDb.doc(usagePath);

    const newCount = await adminDb.runTransaction(async (transaction) => {
      const usageDoc = await transaction.get(usageRef);

      if (!usageDoc.exists) {
        // Create new record with count of 1
        const newUsage = createEmptyUsage(userId, getTodayDate());
        newUsage.materialsGenerated = 1;
        transaction.set(usageRef, newUsage);
        return 1;
      }

      // Increment existing count
      const currentCount = usageDoc.data()!.materialsGenerated || 0;
      transaction.update(usageRef, {
        materialsGenerated: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      return currentCount + 1;
    });

    console.log(`[UsageRepository] Materials count incremented for user ${userId}: ${newCount}`);
    return newCount;
  } catch (error) {
    console.error('[UsageRepository] Failed to increment materials count:', error);
    throw new Error('Failed to update usage count');
  }
}

/**
 * Increment images generated count
 *
 * @param userId - User ID
 * @param count - Number of images to add (default 1)
 * @returns Updated count
 */
export async function incrementImagesCount(userId: string, count: number = 1): Promise<number> {
  try {
    const usagePath = getDailyUsagePath(userId);
    const usageRef = adminDb.doc(usagePath);

    const newCount = await adminDb.runTransaction(async (transaction) => {
      const usageDoc = await transaction.get(usageRef);

      if (!usageDoc.exists) {
        // Create new record
        const newUsage = createEmptyUsage(userId, getTodayDate());
        newUsage.imagesGenerated = count;
        transaction.set(usageRef, newUsage);
        return count;
      }

      // Increment existing count
      const currentCount = usageDoc.data()!.imagesGenerated || 0;
      transaction.update(usageRef, {
        imagesGenerated: admin.firestore.FieldValue.increment(count),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      return currentCount + count;
    });

    console.log(`[UsageRepository] Images count incremented for user ${userId}: +${count} (total: ${newCount})`);
    return newCount;
  } catch (error) {
    console.error('[UsageRepository] Failed to increment images count:', error);
    throw new Error('Failed to update usage count');
  }
}

/**
 * Increment quizzes created count
 *
 * @param userId - User ID
 * @returns Updated count
 */
export async function incrementQuizzesCount(userId: string): Promise<number> {
  try {
    const usagePath = getDailyUsagePath(userId);
    const usageRef = adminDb.doc(usagePath);

    const newCount = await adminDb.runTransaction(async (transaction) => {
      const usageDoc = await transaction.get(usageRef);

      if (!usageDoc.exists) {
        // Create new record
        const newUsage = createEmptyUsage(userId, getTodayDate());
        newUsage.quizzesCreated = 1;
        transaction.set(usageRef, newUsage);
        return 1;
      }

      // Increment existing count
      const currentCount = usageDoc.data()!.quizzesCreated || 0;
      transaction.update(usageRef, {
        quizzesCreated: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      return currentCount + 1;
    });

    console.log(`[UsageRepository] Quizzes count incremented for user ${userId}: ${newCount}`);
    return newCount;
  } catch (error) {
    console.error('[UsageRepository] Failed to increment quizzes count:', error);
    throw new Error('Failed to update usage count');
  }
}

/**
 * Check if user has remaining quota for a specific usage type
 * Compares current usage against user's subscription limits
 *
 * @param userId - User ID
 * @param type - Usage type to check
 * @returns True if user has quota remaining
 */
export async function hasRemainingQuota(
  userId: string,
  type: UsageType
): Promise<{ hasQuota: boolean; current: number; limit: number; remaining: number }> {
  try {
    // Get user profile to check subscription tier and limits
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data()!;
    const subscriptionTier = userData.subscriptionTier || 'free';

    // Get quota limits from user profile
    const dailyMaterialsLimit = userData.quota?.dailyMaterialsLimit || 5;
    const dailyImagesLimit = userData.quota?.dailyImagesLimit || 2;

    // Premium users have unlimited quota
    const isPremium = subscriptionTier === 'premium';

    // Get current usage
    const usage = await getTodayUsage(userId);

    let current = 0;
    let limit = 0;

    switch (type) {
      case 'materials':
        current = usage.materialsGenerated;
        limit = isPremium ? Infinity : dailyMaterialsLimit;
        break;
      case 'images':
        current = usage.imagesGenerated;
        limit = isPremium ? Infinity : dailyImagesLimit;
        break;
      case 'quizzes':
        current = usage.quizzesCreated;
        limit = isPremium ? Infinity : dailyMaterialsLimit; // Same as materials
        break;
    }

    const hasQuota = isPremium || current < limit;
    const remaining = isPremium ? Infinity : Math.max(0, limit - current);

    console.log(`[UsageRepository] Quota check for ${userId} (${type}): ${current}/${limit} (remaining: ${remaining})`);

    return {
      hasQuota,
      current,
      limit,
      remaining,
    };
  } catch (error) {
    console.error('[UsageRepository] Failed to check quota:', error);
    throw new Error('Failed to check quota');
  }
}

/**
 * Reset daily usage for a user
 * Used by cron job to reset quotas at midnight
 *
 * @param userId - User ID
 */
export async function resetDailyUsage(userId: string): Promise<void> {
  try {
    const today = getTodayDate();
    const usagePath = getDailyUsagePath(userId);
    const usageRef = adminDb.doc(usagePath);

    const emptyUsage = createEmptyUsage(userId, today);
    await usageRef.set(emptyUsage);

    console.log(`[UsageRepository] Daily usage reset for user ${userId}`);
  } catch (error) {
    console.error('[UsageRepository] Failed to reset daily usage:', error);
    throw new Error('Failed to reset usage');
  }
}

/**
 * Get usage for a specific date
 *
 * @param userId - User ID
 * @param date - Date in YYYY-MM-DD format
 * @returns Usage data or null if not found
 */
export async function getUsageByDate(
  userId: string,
  date: string
): Promise<DailyUsage | null> {
  try {
    const usagePath = getDailyUsagePath(userId, date);
    const usageRef = adminDb.doc(usagePath);

    const usageDoc = await usageRef.get();

    if (usageDoc.exists) {
      return usageDoc.data()! as DailyUsage;
    }

    return null;
  } catch (error) {
    console.error('[UsageRepository] Failed to get usage by date:', error);
    return null;
  }
}

/**
 * Get usage summary for date range (for analytics)
 * Note: This is a simple implementation. For production, consider using
 * Firestore aggregation queries or pre-computed summaries.
 *
 * @param userId - User ID
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Usage summary
 */
export async function getUsageSummary(
  userId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalMaterials: number;
  totalImages: number;
  totalQuizzes: number;
  daysTracked: number;
}> {
  // This is a placeholder for future implementation
  // For now, return today's usage as a summary
  const todayUsage = await getTodayUsage(userId);

  return {
    totalMaterials: todayUsage.materialsGenerated,
    totalImages: todayUsage.imagesGenerated,
    totalQuizzes: todayUsage.quizzesCreated,
    daysTracked: 1,
  };
}
