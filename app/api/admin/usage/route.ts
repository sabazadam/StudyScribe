/**
 * ADMIN API: Usage Statistics Dashboard
 * ==============================================================================
 * GET endpoint to retrieve usage statistics across all users
 * Requires admin authentication
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth, verifyUserRole } from '@/lib/middleware/authMiddleware';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ==============================================================================
// TYPES
// ==============================================================================

interface UsageStats {
  totalUsers: number;
  activeUsersToday: number;
  materialsGeneratedToday: number;
  imagesGeneratedToday: number;
  quizzesCreatedToday: number;
  usersNearQuota: Array<{
    userId: string;
    email: string;
    tier: string;
    materialsUsed: number;
    materialsLimit: number;
    imagesUsed: number;
    imagesLimit: number;
  }>;
}

// ==============================================================================
// GET HANDLER
// ==============================================================================

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyUserAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Verify admin role
    const isAdmin = await verifyUserRole(user.userId, 'admin');
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    console.log('[Admin/Usage] Fetching usage statistics...');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Calculate statistics
    const stats = await calculateUsageStats(today);

    return NextResponse.json({
      success: true,
      date: today,
      stats,
      generatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Admin/Usage] Error fetching usage stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch usage statistics',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

/**
 * Calculate usage statistics for today
 */
async function calculateUsageStats(date: string): Promise<UsageStats> {
  try {
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const totalUsers = usersSnapshot.size;

    // Get today's usage records
    // Note: This is a simplified implementation
    // For production, consider using aggregation queries or pre-computed stats

    let activeUsersToday = 0;
    let materialsGeneratedToday = 0;
    let imagesGeneratedToday = 0;
    let quizzesCreatedToday = 0;
    const usersNearQuota: UsageStats['usersNearQuota'] = [];

    // Iterate through users to get their today's usage
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      try {
        // Get user's daily usage
        const usageRef = collection(db, `usage/${userId}/daily`);
        const usageQuery = query(usageRef, where('date', '==', date), limit(1));
        const usageSnapshot = await getDocs(usageQuery);

        if (!usageSnapshot.empty) {
          const usageData = usageSnapshot.docs[0].data();

          activeUsersToday++;
          materialsGeneratedToday += usageData.materialsGenerated || 0;
          imagesGeneratedToday += usageData.imagesGenerated || 0;
          quizzesCreatedToday += usageData.quizzesCreated || 0;

          // Check if user is near quota (>80% usage)
          const materialsLimit = userData.quota?.dailyMaterialsLimit || 5;
          const imagesLimit = userData.quota?.dailyImagesLimit || 2;
          const tier = userData.subscriptionTier || 'free';

          const materialsUsage = (usageData.materialsGenerated || 0) / materialsLimit;
          const imagesUsage = (usageData.imagesGenerated || 0) / imagesLimit;

          if (tier !== 'premium' && (materialsUsage >= 0.8 || imagesUsage >= 0.8)) {
            usersNearQuota.push({
              userId,
              email: userData.email || 'unknown',
              tier,
              materialsUsed: usageData.materialsGenerated || 0,
              materialsLimit,
              imagesUsed: usageData.imagesGenerated || 0,
              imagesLimit,
            });
          }
        }
      } catch (error) {
        console.error(`[Admin/Usage] Error fetching usage for user ${userId}:`, error);
        // Continue with next user
      }
    }

    return {
      totalUsers,
      activeUsersToday,
      materialsGeneratedToday,
      imagesGeneratedToday,
      quizzesCreatedToday,
      usersNearQuota,
    };
  } catch (error) {
    console.error('[Admin/Usage] Error calculating stats:', error);
    throw error;
  }
}
