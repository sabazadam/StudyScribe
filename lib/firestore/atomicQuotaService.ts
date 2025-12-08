/**
 * ATOMIC QUOTA SERVICE
 * ==============================================================================
 * Provides atomic reserve-execute-commit pattern for quota enforcement
 * Prevents race conditions by combining check + increment in single transaction
 * ==============================================================================
 *
 * USAGE PATTERN:
 *
 * 1. Reserve quota atomically:
 *    const reservation = await reserveQuota(userId, 'materials', cost);
 *
 * 2. Do expensive operation (generation, transcription, etc.)
 *
 * 3. On success: commit is automatic (reservation already incremented)
 *
 * 4. On failure: rollback the reservation
 *    await rollbackReservation(reservation);
 *
 * ==============================================================================
 */

import { adminDb } from '@/lib/firebase/adminConfig';
import admin from '@/lib/firebase/adminConfig';
import { UsageType } from './usageRepository';
import { CostEndpoint } from './costRepository';

// ==============================================================================
// TYPES
// ==============================================================================

export interface QuotaReservation {
  reservationId: string;
  userId: string;
  quotaType: UsageType;
  costEndpoint: CostEndpoint;
  estimatedCost: number;
  reservedAt: string;
  committed: boolean;
}

export class QuotaReservationError extends Error {
  constructor(
    message: string,
    public reason: 'QUOTA_EXCEEDED' | 'BUDGET_EXCEEDED' | 'GLOBAL_BUDGET_EXCEEDED' | 'TRANSACTION_FAILED',
    public details?: any
  ) {
    super(message);
    this.name = 'QuotaReservationError';
  }
}

// ==============================================================================
// CONFIGURATION
// ==============================================================================

// Budget limits (from costRepository)
const USER_DAILY_BUDGET_USD = 5;
const GLOBAL_DAILY_BUDGET_USD = 50;

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function generateReservationId(): string {
  return `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getUsagePath(userId: string, date: string): string {
  return `usage/${userId}/daily/${date}`;
}

function getCostPath(userId: string, date: string): string {
  return `costs/${userId}/daily/${date}`;
}

function getGlobalCostPath(date: string): string {
  return `costs/global/daily/${date}`;
}

function getUserPath(userId: string): string {
  return `users/${userId}`;
}

function getBreakdownField(endpoint: CostEndpoint): string {
  const mapping: Record<CostEndpoint, string> = {
    'generate-materials': 'generateMaterials',
    'generate-image': 'generateImage',
    'transcribe': 'transcribe',
    'extract-slides': 'extractSlides',
  };
  return mapping[endpoint];
}

function getUsageField(quotaType: UsageType): string {
  const mapping: Record<UsageType, string> = {
    materials: 'materialsGenerated',
    images: 'imagesGenerated',
    quizzes: 'quizzesCreated',
  };
  return mapping[quotaType];
}

// ==============================================================================
// ATOMIC QUOTA RESERVATION
// ==============================================================================

/**
 * Atomically reserve quota for an operation
 * This is the ONLY function that should be called before expensive operations
 *
 * Performs in a SINGLE TRANSACTION:
 * 1. Read user profile (subscription tier, quota limits)
 * 2. Read current usage and costs
 * 3. Check quota limits (considering subscription tier)
 * 4. Check user budget (skip for premium users)
 * 5. Check global budget
 * 6. Increment usage counter
 * 7. Increment cost tracking (user + global)
 *
 * If ANY check fails, transaction aborts and nothing is changed
 * If ALL checks pass, quota is atomically reserved
 *
 * @param userId - User ID
 * @param quotaType - Type of quota to reserve
 * @param costEndpoint - Endpoint for cost tracking
 * @param estimatedCost - Estimated cost in USD
 * @param incrementBy - Number of units to increment (default 1)
 * @returns Reservation object
 * @throws QuotaReservationError if reservation fails
 */
export async function reserveQuota(
  userId: string,
  quotaType: UsageType,
  costEndpoint: CostEndpoint,
  estimatedCost: number,
  incrementBy: number = 1
): Promise<QuotaReservation> {
  const today = getTodayDate();
  const reservationId = generateReservationId();
  const reservedAt = new Date().toISOString();

  try {
    // Run atomic transaction
    await adminDb.runTransaction(async (transaction) => {
      // 1. Read user profile
      const userRef = adminDb.doc(getUserPath(userId));
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new QuotaReservationError(
          'User profile not found',
          'TRANSACTION_FAILED'
        );
      }

      const userData = userDoc.data()!;
      const subscriptionTier = userData.subscriptionTier || 'free';
      const isPremium = subscriptionTier === 'premium';

      // Get quota limits from user profile
      const dailyMaterialsLimit = userData.quota?.dailyMaterialsLimit || 5;
      const dailyImagesLimit = userData.quota?.dailyImagesLimit || 2;

      // 2. Read current usage
      const usageRef = adminDb.doc(getUsagePath(userId, today));
      const usageDoc = await transaction.get(usageRef);

      const currentUsage = usageDoc.exists
        ? usageDoc.data()!
        : {
            userId,
            date: today,
            materialsGenerated: 0,
            imagesGenerated: 0,
            quizzesCreated: 0,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          };

      // 3. Check quota limits (based on subscription tier)
      let quotaLimit = 0;
      let currentCount = 0;
      const usageField = getUsageField(quotaType);

      switch (quotaType) {
        case 'materials':
          currentCount = currentUsage.materialsGenerated || 0;
          quotaLimit = isPremium ? Infinity : dailyMaterialsLimit;
          break;
        case 'images':
          currentCount = currentUsage.imagesGenerated || 0;
          quotaLimit = isPremium ? Infinity : dailyImagesLimit;
          break;
        case 'quizzes':
          currentCount = currentUsage.quizzesCreated || 0;
          quotaLimit = isPremium ? Infinity : dailyMaterialsLimit;
          break;
      }

      // Check if quota would be exceeded after increment
      const newCount = currentCount + incrementBy;
      if (newCount > quotaLimit && !isPremium) {
        throw new QuotaReservationError(
          `Daily quota exceeded for ${quotaType}. Current: ${currentCount}/${quotaLimit}. Resets at midnight UTC.`,
          'QUOTA_EXCEEDED',
          {
            quotaType,
            current: currentCount,
            limit: quotaLimit,
            requested: incrementBy,
          }
        );
      }

      // 4. Check user budget (skip for premium users)
      if (!isPremium) {
        const costRef = adminDb.doc(getCostPath(userId, today));
        const costDoc = await transaction.get(costRef);

        const currentCost = costDoc.exists
          ? costDoc.data()!.totalCost || 0
          : 0;

        const newCost = currentCost + estimatedCost;

        if (newCost > USER_DAILY_BUDGET_USD) {
          throw new QuotaReservationError(
            `Daily budget exceeded. Current: $${currentCost.toFixed(2)}/$${USER_DAILY_BUDGET_USD.toFixed(2)}. Resets at midnight UTC.`,
            'BUDGET_EXCEEDED',
            {
              current: currentCost,
              limit: USER_DAILY_BUDGET_USD,
              requested: estimatedCost,
            }
          );
        }
      }

      // 5. Check global budget
      const globalCostRef = adminDb.doc(getGlobalCostPath(today));
      const globalCostDoc = await transaction.get(globalCostRef);

      const currentGlobalCost = globalCostDoc.exists
        ? globalCostDoc.data()!.totalCost || 0
        : 0;

      const newGlobalCost = currentGlobalCost + estimatedCost;

      if (newGlobalCost > GLOBAL_DAILY_BUDGET_USD) {
        throw new QuotaReservationError(
          `Platform daily budget exceeded ($${currentGlobalCost.toFixed(2)}/$${GLOBAL_DAILY_BUDGET_USD.toFixed(2)}). Service will resume tomorrow at midnight UTC.`,
          'GLOBAL_BUDGET_EXCEEDED',
          {
            current: currentGlobalCost,
            limit: GLOBAL_DAILY_BUDGET_USD,
            requested: estimatedCost,
          }
        );
      }

      // 6. Read user cost document (MUST happen before writes)
      const userCostRef = adminDb.doc(getCostPath(userId, today));
      const userCostDoc = await transaction.get(userCostRef);

      // ========================================================================
      // === ALL READS COMPLETE - ALL CHECKS PASSED - NOW DO WRITES ===
      // ========================================================================

      // 7. Increment usage counter
      if (usageDoc.exists) {
        transaction.update(usageRef, {
          [usageField]: admin.firestore.FieldValue.increment(incrementBy),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const newUsage: any = {
          userId,
          date: today,
          materialsGenerated: 0,
          imagesGenerated: 0,
          quizzesCreated: 0,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        };
        newUsage[usageField] = incrementBy;
        transaction.set(usageRef, newUsage);
      }

      // 8. Increment cost tracking
      const breakdownField = `breakdown.${getBreakdownField(costEndpoint)}`;

      // Update user costs (document already fetched in read phase above)
      if (userCostDoc.exists) {
        transaction.update(userCostRef, {
          totalCost: admin.firestore.FieldValue.increment(estimatedCost),
          [breakdownField]: admin.firestore.FieldValue.increment(estimatedCost),
          requestCount: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        transaction.set(userCostRef, {
          userId,
          date: today,
          totalCost: estimatedCost,
          breakdown: {
            generateMaterials: 0,
            generateImage: 0,
            transcribe: 0,
            extractSlides: 0,
            [getBreakdownField(costEndpoint)]: estimatedCost,
          },
          requestCount: 1,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Update global costs
      if (globalCostDoc.exists) {
        transaction.update(globalCostRef, {
          totalCost: admin.firestore.FieldValue.increment(estimatedCost),
          [breakdownField]: admin.firestore.FieldValue.increment(estimatedCost),
          requestCount: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        transaction.set(globalCostRef, {
          date: today,
          totalCost: estimatedCost,
          breakdown: {
            generateMaterials: 0,
            generateImage: 0,
            transcribe: 0,
            extractSlides: 0,
            [getBreakdownField(costEndpoint)]: estimatedCost,
          },
          requestCount: 1,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      console.log(
        `[AtomicQuota] Reserved: ${quotaType} for user ${userId}, cost: $${estimatedCost.toFixed(4)}, reservation: ${reservationId}`
      );
    });

    // Transaction succeeded - return reservation
    return {
      reservationId,
      userId,
      quotaType,
      costEndpoint,
      estimatedCost,
      reservedAt,
      committed: true, // Already committed in transaction
    };
  } catch (error: any) {
    console.error('[AtomicQuota] Reservation failed:', error);

    // Re-throw quota errors as-is
    if (error instanceof QuotaReservationError) {
      throw error;
    }

    // Wrap other errors
    throw new QuotaReservationError(
      'Failed to reserve quota. Please try again.',
      'TRANSACTION_FAILED',
      { originalError: error.message }
    );
  }
}

/**
 * Rollback a quota reservation if operation fails
 *
 * IMPORTANT: Only use this if the operation fails AFTER reservation
 * If reservation succeeds but operation fails, this will refund the quota
 *
 * @param reservation - Reservation to rollback
 */
export async function rollbackReservation(
  reservation: QuotaReservation,
  rollbackBy: number = 1
): Promise<void> {
  const today = getTodayDate();

  try {
    await adminDb.runTransaction(async (transaction) => {
      // Decrement usage counter
      const usageRef = adminDb.doc(getUsagePath(reservation.userId, today));
      const usageDoc = await transaction.get(usageRef);
      const usageField = getUsageField(reservation.quotaType);

      if (usageDoc.exists) {
        transaction.update(usageRef, {
          [usageField]: admin.firestore.FieldValue.increment(-rollbackBy),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Decrement cost tracking
      const breakdownField = `breakdown.${getBreakdownField(reservation.costEndpoint)}`;

      // Update user costs
      const userCostRef = adminDb.doc(getCostPath(reservation.userId, today));
      const userCostDoc = await transaction.get(userCostRef);

      if (userCostDoc.exists) {
        transaction.update(userCostRef, {
          totalCost: admin.firestore.FieldValue.increment(-reservation.estimatedCost),
          [breakdownField]: admin.firestore.FieldValue.increment(-reservation.estimatedCost),
          requestCount: admin.firestore.FieldValue.increment(-1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Update global costs
      const globalCostRef = adminDb.doc(getGlobalCostPath(today));
      const globalCostDoc = await transaction.get(globalCostRef);

      if (globalCostDoc.exists) {
        transaction.update(globalCostRef, {
          totalCost: admin.firestore.FieldValue.increment(-reservation.estimatedCost),
          [breakdownField]: admin.firestore.FieldValue.increment(-reservation.estimatedCost),
          requestCount: admin.firestore.FieldValue.increment(-1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      console.log(
        `[AtomicQuota] Rolled back reservation ${reservation.reservationId} for user ${reservation.userId}`
      );
    });
  } catch (error: any) {
    console.error('[AtomicQuota] Rollback failed:', error);
    // Don't throw - rollback failures should not break the response
    // Log for manual reconciliation if needed
    console.error('[AtomicQuota] MANUAL RECONCILIATION NEEDED:', {
      reservationId: reservation.reservationId,
      userId: reservation.userId,
      quotaType: reservation.quotaType,
      cost: reservation.estimatedCost,
      error: error.message,
    });
  }
}

/**
 * Check quota availability without reserving
 * Useful for displaying quota status to users
 *
 * WARNING: This is NOT atomic and should NOT be used for enforcement
 * Always use reserveQuota() for actual operations
 */
export async function checkQuotaAvailability(
  userId: string,
  quotaType: UsageType
): Promise<{
  available: boolean;
  current: number;
  limit: number;
  remaining: number;
  isPremium: boolean;
}> {
  try {
    const today = getTodayDate();

    // Read user profile - USE ADMIN SDK
    const userRef = adminDb.doc(getUserPath(userId));
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data()!;
    const subscriptionTier = userData.subscriptionTier || 'free';
    const isPremium = subscriptionTier === 'premium';

    // Get quota limits
    const dailyMaterialsLimit = userData.quota?.dailyMaterialsLimit || 5;
    const dailyImagesLimit = userData.quota?.dailyImagesLimit || 2;

    // Read current usage - USE ADMIN SDK
    const usageRef = adminDb.doc(getUsagePath(userId, today));
    const usageDoc = await usageRef.get();

    const currentUsage = usageDoc.exists ? usageDoc.data() : null;

    let currentCount = 0;
    let limit = 0;

    switch (quotaType) {
      case 'materials':
        currentCount = currentUsage?.materialsGenerated || 0;
        limit = isPremium ? Infinity : dailyMaterialsLimit;
        break;
      case 'images':
        currentCount = currentUsage?.imagesGenerated || 0;
        limit = isPremium ? Infinity : dailyImagesLimit;
        break;
      case 'quizzes':
        currentCount = currentUsage?.quizzesCreated || 0;
        limit = isPremium ? Infinity : dailyMaterialsLimit;
        break;
    }

    const available = isPremium || currentCount < limit;
    const remaining = isPremium ? Infinity : Math.max(0, limit - currentCount);

    return {
      available,
      current: currentCount,
      limit,
      remaining,
      isPremium,
    };
  } catch (error: any) {
    console.error('[AtomicQuota] Failed to check quota availability:', error);
    throw new Error('Failed to check quota availability');
  }
}
