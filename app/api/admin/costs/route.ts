/**
 * ADMIN API: Cost Tracking Dashboard
 * ==============================================================================
 * GET endpoint to retrieve cost statistics and breakdowns
 * Requires admin authentication
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth, verifyUserRole } from '@/lib/middleware/authMiddleware';
import { getGlobalDailyCost, DAILY_BUDGET_USD } from '@/lib/firestore/costRepository';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ==============================================================================
// TYPES
// ==============================================================================

interface CostStats {
  today: {
    total: number;
    limit: number;
    percentage: number;
    breakdown: {
      generateMaterials: number;
      generateImage: number;
      transcribe: number;
      extractSlides: number;
    };
  };
  topSpenders: Array<{
    userId: string;
    email: string;
    tier: string;
    totalCost: number;
    requestCount: number;
  }>;
  costByEndpoint: {
    generateMaterials: number;
    generateImage: number;
    transcribe: number;
    extractSlides: number;
  };
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

    console.log('[Admin/Costs] Fetching cost statistics...');

    // Get query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'today'; // today, week, month

    // Calculate statistics
    const stats = await calculateCostStats(period);

    return NextResponse.json({
      success: true,
      period,
      stats,
      generatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Admin/Costs] Error fetching cost stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cost statistics',
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
 * Calculate cost statistics
 */
async function calculateCostStats(period: string): Promise<CostStats> {
  try {
    // Get global daily cost
    const globalCost = await getGlobalDailyCost();

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Get top spenders
    const topSpenders = await getTopSpendersForDate(today);

    const stats: CostStats = {
      today: {
        total: globalCost.totalCost,
        limit: DAILY_BUDGET_USD,
        percentage: (globalCost.totalCost / DAILY_BUDGET_USD) * 100,
        breakdown: globalCost.breakdown,
      },
      topSpenders,
      costByEndpoint: globalCost.breakdown,
    };

    return stats;
  } catch (error) {
    console.error('[Admin/Costs] Error calculating stats:', error);
    throw error;
  }
}

/**
 * Get top spending users for a specific date
 */
async function getTopSpendersForDate(
  date: string,
  limitCount: number = 10
): Promise<CostStats['topSpenders']> {
  try {
    const topSpenders: CostStats['topSpenders'] = [];

    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    // Collect all user costs for the date
    const userCosts: Array<{
      userId: string;
      email: string;
      tier: string;
      totalCost: number;
      requestCount: number;
    }> = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      try {
        // Get user's cost for the date
        const costRef = collection(db, `costs/${userId}/daily`);
        const costQuery = query(costRef, where('date', '==', date));
        const costSnapshot = await getDocs(costQuery);

        if (!costSnapshot.empty) {
          const costData = costSnapshot.docs[0].data();

          userCosts.push({
            userId,
            email: userData.email || 'unknown',
            tier: userData.subscriptionTier || 'free',
            totalCost: costData.totalCost || 0,
            requestCount: costData.requestCount || 0,
          });
        }
      } catch (error) {
        console.error(`[Admin/Costs] Error fetching cost for user ${userId}:`, error);
        // Continue with next user
      }
    }

    // Sort by total cost (descending) and take top N
    userCosts.sort((a, b) => b.totalCost - a.totalCost);
    return userCosts.slice(0, limitCount);

  } catch (error) {
    console.error('[Admin/Costs] Error fetching top spenders:', error);
    return [];
  }
}

/**
 * Get cost trend data for charts
 * TODO: Implement for weekly/monthly periods
 */
async function getCostTrend(period: string): Promise<any> {
  // Placeholder for future implementation
  return null;
}
