/**
 * DAILY QUOTA RESET CRON JOB
 * ==============================================================================
 * Reset daily usage quotas for all users at midnight UTC
 * To be called by Vercel Cron Jobs or similar scheduler
 * ==============================================================================
 */

import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { resetAlertTracking } from '@/lib/alerts/budgetAlerts';

// ==============================================================================
// MAIN RESET FUNCTION
// ==============================================================================

/**
 * Reset daily quotas for all users
 * Should be called at midnight UTC daily
 *
 * @returns Summary of reset operation
 */
export async function resetDailyQuotas(): Promise<{
  success: boolean;
  usersProcessed: number;
  errors: number;
  timestamp: string;
}> {
  console.log('[CronJob] Starting daily quota reset...');
  const startTime = Date.now();

  let usersProcessed = 0;
  let errors = 0;

  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    console.log(`[CronJob] Found ${usersSnapshot.size} users to process`);

    // Reset usage for each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      try {
        await resetUserDailyUsage(userId, today);
        usersProcessed++;

        // Log progress every 10 users
        if (usersProcessed % 10 === 0) {
          console.log(`[CronJob] Processed ${usersProcessed}/${usersSnapshot.size} users`);
        }
      } catch (error) {
        console.error(`[CronJob] Error resetting usage for user ${userId}:`, error);
        errors++;
      }
    }

    // Reset budget alert tracking
    resetAlertTracking();
    console.log('[CronJob] Budget alert tracking reset');

    const duration = Date.now() - startTime;
    console.log(`[CronJob] Daily quota reset completed in ${duration}ms`);
    console.log(`[CronJob] Users processed: ${usersProcessed}, Errors: ${errors}`);

    return {
      success: true,
      usersProcessed,
      errors,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[CronJob] Critical error during quota reset:', error);
    return {
      success: false,
      usersProcessed,
      errors: errors + 1,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Reset daily usage for a single user
 *
 * @param userId - User ID
 * @param date - Date in YYYY-MM-DD format
 */
async function resetUserDailyUsage(userId: string, date: string): Promise<void> {
  try {
    // Create new empty usage record for today
    const usagePath = `usage/${userId}/daily/${date}`;
    const usageRef = doc(db, usagePath);

    const emptyUsage = {
      userId,
      date,
      materialsGenerated: 0,
      imagesGenerated: 0,
      quizzesCreated: 0,
      lastUpdated: serverTimestamp(),
    };

    await setDoc(usageRef, emptyUsage);

    // Note: Old usage records are kept for historical analytics
    // Consider implementing a cleanup job to archive old records after 30-90 days
  } catch (error) {
    console.error(`[CronJob] Error resetting usage for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Reset daily costs for global tracking
 * Note: User-specific costs are kept for historical data
 *
 * @param date - Date in YYYY-MM-DD format
 */
async function resetGlobalDailyCost(date: string): Promise<void> {
  try {
    const costPath = `costs/global/daily/${date}`;
    const costRef = doc(db, costPath);

    const emptyCost = {
      date,
      totalCost: 0,
      breakdown: {
        generateMaterials: 0,
        generateImage: 0,
        transcribe: 0,
        extractSlides: 0,
      },
      requestCount: 0,
      lastUpdated: serverTimestamp(),
    };

    await setDoc(costRef, emptyCost);
    console.log('[CronJob] Global daily cost reset');
  } catch (error) {
    console.error('[CronJob] Error resetting global cost:', error);
    throw error;
  }
}

// ==============================================================================
// CLEANUP FUNCTIONS (Optional)
// ==============================================================================

/**
 * Archive old usage records (older than specified days)
 * Run weekly to keep database size manageable
 *
 * @param daysToKeep - Number of days of history to keep
 */
export async function archiveOldUsageRecords(daysToKeep: number = 90): Promise<{
  success: boolean;
  recordsArchived: number;
  errors: number;
}> {
  console.log(`[CronJob] Starting archive of usage records older than ${daysToKeep} days...`);

  let recordsArchived = 0;
  let errors = 0;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // TODO: Implement archival logic
    // For now, this is a placeholder
    // Consider moving old records to a separate collection or cloud storage

    console.log('[CronJob] Archive not yet implemented');

    return {
      success: true,
      recordsArchived,
      errors,
    };
  } catch (error) {
    console.error('[CronJob] Error during archival:', error);
    return {
      success: false,
      recordsArchived,
      errors: errors + 1,
    };
  }
}

/**
 * Generate daily usage report
 * Can be called before quota reset to send daily summary
 */
export async function generateDailyReport(): Promise<{
  date: string;
  totalUsers: number;
  activeUsers: number;
  totalMaterials: number;
  totalImages: number;
  totalCost: number;
}> {
  console.log('[CronJob] Generating daily report...');

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().split('T')[0];

    // TODO: Implement report generation
    // Aggregate yesterday's usage and costs

    return {
      date,
      totalUsers: 0,
      activeUsers: 0,
      totalMaterials: 0,
      totalImages: 0,
      totalCost: 0,
    };
  } catch (error) {
    console.error('[CronJob] Error generating daily report:', error);
    throw error;
  }
}

// ==============================================================================
// VERCEL CRON API ROUTE
// ==============================================================================

/**
 * This function should be called from an API route configured with Vercel Cron
 *
 * Example: app/api/cron/reset-quotas/route.ts
 *
 * export async function GET(request: Request) {
 *   // Verify cron secret to prevent unauthorized calls
 *   const authHeader = request.headers.get('authorization');
 *   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *
 *   const result = await resetDailyQuotas();
 *   return Response.json(result);
 * }
 *
 * Then configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/reset-quotas",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

// ==============================================================================
// MANUAL TESTING
// ==============================================================================

/**
 * Test quota reset without actually modifying data
 * Useful for debugging
 */
export async function testQuotaReset(): Promise<void> {
  console.log('[CronJob] Running test quota reset (dry run)...');

  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    console.log(`[CronJob] Would reset quotas for ${usersSnapshot.size} users`);
    console.log('[CronJob] Dry run completed successfully');
  } catch (error) {
    console.error('[CronJob] Test failed:', error);
  }
}
