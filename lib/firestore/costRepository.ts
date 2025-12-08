/**
 * COST REPOSITORY
 * ==============================================================================
 * Track API costs per user and globally
 * Stores cost records in Firestore: costs/{userId}/daily/{date}
 * Global costs stored at: costs/global/daily/{date}
 * ==============================================================================
 */

import { adminDb } from '@/lib/firebase/adminConfig';
import admin from '@/lib/firebase/adminConfig';

// ==============================================================================
// TYPES
// ==============================================================================

export interface CostRecord {
  userId?: string; // Omit for global costs
  date: string; // YYYY-MM-DD format
  totalCost: number; // Total cost in USD
  breakdown: {
    generateMaterials: number;
    generateImage: number;
    transcribe: number;
    extractSlides: number;
  };
  requestCount: number;
  lastUpdated: any; // Firestore Timestamp
}

export type CostEndpoint =
  | 'generate-materials'
  | 'generate-image'
  | 'transcribe'
  | 'extract-slides';

// ==============================================================================
// COST ESTIMATES
// ==============================================================================

export const COST_ESTIMATES = {
  'generate-materials': {
    gemini_flash: 0.02, // ~$0.02 per material (Gemini Flash 2.0)
    gemini_pro: 0.05, // ~$0.05 per material (Gemini Pro)
    gemini_experimental: 0.03, // ~$0.03 per material (Experimental)
  },
  'generate-image': 0.04, // ~$0.04 per image (Imagen)
  transcribe: 0.006, // ~$0.006 per minute
  'extract-slides': 0.001, // ~$0.001 per PDF
};

// ==============================================================================
// BUDGET CONFIGURATION
// ==============================================================================

export const DAILY_BUDGET_USD = 50; // Maximum spend per day across all users
export const USER_DAILY_BUDGET_USD = 5; // Maximum spend per user per day (premium users exempt)

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
 * Get Firestore document path for user's daily costs
 */
function getDailyCostPath(userId: string, date?: string): string {
  const targetDate = date || getTodayDate();
  return `costs/${userId}/daily/${targetDate}`;
}

/**
 * Get Firestore document path for global daily costs
 */
function getGlobalCostPath(date?: string): string {
  const targetDate = date || getTodayDate();
  return `costs/global/daily/${targetDate}`;
}

/**
 * Initialize empty cost record
 */
function createEmptyCostRecord(userId?: string, date?: string): CostRecord {
  return {
    userId,
    date: date || getTodayDate(),
    totalCost: 0,
    breakdown: {
      generateMaterials: 0,
      generateImage: 0,
      transcribe: 0,
      extractSlides: 0,
    },
    requestCount: 0,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  };
}

/**
 * Map endpoint name to breakdown field
 */
function getBreakdownField(endpoint: CostEndpoint): keyof CostRecord['breakdown'] {
  const mapping: Record<CostEndpoint, keyof CostRecord['breakdown']> = {
    'generate-materials': 'generateMaterials',
    'generate-image': 'generateImage',
    transcribe: 'transcribe',
    'extract-slides': 'extractSlides',
  };
  return mapping[endpoint];
}

// ==============================================================================
// COST TRACKING FUNCTIONS
// ==============================================================================

/**
 * Record API cost for a user
 * Updates both user-specific and global cost records
 *
 * @param userId - User ID
 * @param endpoint - API endpoint name
 * @param cost - Cost in USD
 */
export async function recordCost(
  userId: string,
  endpoint: CostEndpoint,
  cost: number
): Promise<void> {
  try {
    const today = getTodayDate();
    const userCostPath = getDailyCostPath(userId);
    const globalCostPath = getGlobalCostPath();

    const userCostRef = adminDb.doc(userCostPath);
    const globalCostRef = adminDb.doc(globalCostPath);
    const breakdownField = getBreakdownField(endpoint);

    // Use transaction to update both user and global costs atomically
    await adminDb.runTransaction(async (transaction) => {
      // Update user costs
      const userCostDoc = await transaction.get(userCostRef);
      if (!userCostDoc.exists) {
        const newRecord = createEmptyCostRecord(userId, today);
        newRecord.totalCost = cost;
        newRecord.breakdown[breakdownField] = cost;
        newRecord.requestCount = 1;
        transaction.set(userCostRef, newRecord);
      } else {
        transaction.update(userCostRef, {
          totalCost: admin.firestore.FieldValue.increment(cost),
          [`breakdown.${breakdownField}`]: admin.firestore.FieldValue.increment(cost),
          requestCount: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Update global costs
      const globalCostDoc = await transaction.get(globalCostRef);
      if (!globalCostDoc.exists) {
        const newRecord = createEmptyCostRecord(undefined, today);
        newRecord.totalCost = cost;
        newRecord.breakdown[breakdownField] = cost;
        newRecord.requestCount = 1;
        transaction.set(globalCostRef, newRecord);
      } else {
        transaction.update(globalCostRef, {
          totalCost: admin.firestore.FieldValue.increment(cost),
          [`breakdown.${breakdownField}`]: admin.firestore.FieldValue.increment(cost),
          requestCount: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    console.log(
      `[CostRepository] Recorded cost for user ${userId}: $${cost.toFixed(4)} (${endpoint})`
    );
  } catch (error) {
    console.error('[CostRepository] Failed to record cost:', error);
    throw new Error('Failed to record cost');
  }
}

/**
 * Get today's cost for a user
 *
 * @param userId - User ID
 * @returns Cost record or empty record if doesn't exist
 */
export async function getTodayCost(userId: string): Promise<CostRecord> {
  try {
    const costPath = getDailyCostPath(userId);
    const costRef = adminDb.doc(costPath);

    const costDoc = await costRef.get();

    if (costDoc.exists) {
      return costDoc.data() as CostRecord;
    }

    // Return empty record
    return createEmptyCostRecord(userId);
  } catch (error) {
    console.error('[CostRepository] Failed to get today cost:', error);
    throw new Error('Failed to retrieve cost data');
  }
}

/**
 * Get global daily cost across all users
 *
 * @returns Global cost record
 */
export async function getGlobalDailyCost(): Promise<CostRecord> {
  try {
    const costPath = getGlobalCostPath();
    const costRef = adminDb.doc(costPath);

    const costDoc = await costRef.get();

    if (costDoc.exists) {
      return costDoc.data() as CostRecord;
    }

    // Return empty record
    return createEmptyCostRecord();
  } catch (error) {
    console.error('[CostRepository] Failed to get global cost:', error);
    throw new Error('Failed to retrieve global cost data');
  }
}

/**
 * Check if user has exceeded their personal daily budget
 * Premium users are exempt from personal budget limits
 *
 * @param userId - User ID
 * @returns True if budget exceeded
 */
export async function hasExceededBudget(userId: string): Promise<{
  exceeded: boolean;
  current: number;
  limit: number;
  remaining: number;
}> {
  try {
    // Get user profile to check subscription tier
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data()!
    const subscriptionTier = userData.subscriptionTier || 'free';

    // Premium users exempt from personal budget limits
    if (subscriptionTier === 'premium') {
      return {
        exceeded: false,
        current: 0,
        limit: Infinity,
        remaining: Infinity,
      };
    }

    // Get today's cost
    const todayCost = await getTodayCost(userId);
    const current = todayCost.totalCost;
    const limit = USER_DAILY_BUDGET_USD;
    const exceeded = current >= limit;
    const remaining = Math.max(0, limit - current);

    console.log(
      `[CostRepository] Budget check for user ${userId}: $${current.toFixed(2)}/$${limit} (${exceeded ? 'EXCEEDED' : 'OK'})`
    );

    return {
      exceeded,
      current,
      limit,
      remaining,
    };
  } catch (error) {
    console.error('[CostRepository] Failed to check budget:', error);
    throw new Error('Failed to check budget');
  }
}

/**
 * Check if global budget has been exceeded
 *
 * @returns True if global budget exceeded
 */
export async function hasExceededGlobalBudget(): Promise<{
  exceeded: boolean;
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
}> {
  try {
    const globalCost = await getGlobalDailyCost();
    const current = globalCost.totalCost;
    const limit = DAILY_BUDGET_USD;
    const exceeded = current >= limit;
    const remaining = Math.max(0, limit - current);
    const percentage = (current / limit) * 100;

    console.log(
      `[CostRepository] Global budget check: $${current.toFixed(2)}/$${limit} (${percentage.toFixed(1)}%)`
    );

    return {
      exceeded,
      current,
      limit,
      remaining,
      percentage,
    };
  } catch (error) {
    console.error('[CostRepository] Failed to check global budget:', error);
    throw new Error('Failed to check global budget');
  }
}

/**
 * Get cost estimate for an endpoint
 *
 * @param endpoint - API endpoint
 * @param modelTier - Model tier (for generate-materials)
 * @returns Estimated cost in USD
 */
export function getEstimatedCost(
  endpoint: CostEndpoint,
  modelTier?: 'gemini_flash' | 'gemini_pro' | 'gemini_experimental'
): number {
  if (endpoint === 'generate-materials' && modelTier) {
    return COST_ESTIMATES['generate-materials'][modelTier];
  }

  if (endpoint === 'generate-materials') {
    // Default to Flash if tier not specified
    return COST_ESTIMATES['generate-materials'].gemini_flash;
  }

  return COST_ESTIMATES[endpoint];
}

/**
 * Get cost breakdown by endpoint for a user
 *
 * @param userId - User ID
 * @param date - Date in YYYY-MM-DD format (default: today)
 * @returns Cost breakdown
 */
export async function getCostBreakdown(
  userId: string,
  date?: string
): Promise<CostRecord['breakdown']> {
  try {
    const costPath = getDailyCostPath(userId, date);
    const costRef = adminDb.doc(costPath);

    const costDoc = await costRef.get();

    if (costDoc.exists) {
      const costData = costDoc.data() as CostRecord;
      return costData.breakdown;
    }

    // Return empty breakdown
    return {
      generateMaterials: 0,
      generateImage: 0,
      transcribe: 0,
      extractSlides: 0,
    };
  } catch (error) {
    console.error('[CostRepository] Failed to get cost breakdown:', error);
    throw new Error('Failed to retrieve cost breakdown');
  }
}

/**
 * Get top spending users (for admin dashboard)
 * Note: This is a simple implementation. For production scale,
 * consider using Firestore aggregation or pre-computed analytics.
 *
 * @param limit - Number of top users to return
 * @returns Array of user IDs and their costs
 */
export async function getTopSpenders(
  limit: number = 10
): Promise<Array<{ userId: string; totalCost: number }>> {
  try {
    // This is a placeholder implementation
    // In production, you'd want to use Firestore aggregation queries
    // or maintain a separate collection for analytics

    console.log('[CostRepository] getTopSpenders not fully implemented yet');

    return [];
  } catch (error) {
    console.error('[CostRepository] Failed to get top spenders:', error);
    return [];
  }
}

/**
 * Reset daily costs (for testing purposes)
 * WARNING: Use with caution
 *
 * @param userId - User ID
 */
export async function resetDailyCost(userId: string): Promise<void> {
  try {
    const today = getTodayDate();
    const costPath = getDailyCostPath(userId);
    const costRef = adminDb.doc(costPath);

    const emptyCost = createEmptyCostRecord(userId, today);
    await costRef.set(emptyCost);

    console.log(`[CostRepository] Daily cost reset for user ${userId}`);
  } catch (error) {
    console.error('[CostRepository] Failed to reset daily cost:', error);
    throw new Error('Failed to reset cost');
  }
}
