/**
 * DAILY USAGE API ENDPOINT
 * ==============================================================================
 * GET /api/usage/daily
 * Returns current daily usage for authenticated user
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/adminConfig';
import * as Sentry from '@sentry/nextjs';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getUsagePath(userId: string, date: string): string {
  return `usage/${userId}/daily/${date}`;
}

function getUserPath(userId: string): string {
  return `users/${userId}`;
}

export async function GET(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'GET /api/usage/daily',
    },
    async (span) => {
      try {
        // Verify authentication
        const user = await verifyUserAuth(request);
        if (!user) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        span.setAttribute('user_id', user.userId);

        const today = getTodayDate();

        // Fetch user profile for quota limits
        const userRef = adminDb.doc(getUserPath(user.userId));
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          return NextResponse.json(
            { error: 'User profile not found' },
            { status: 404 }
          );
        }

        const userData = userDoc.data()!;
        const subscriptionTier = userData.subscriptionTier || 'free';
        const isPremium = subscriptionTier === 'premium';

        // Get quota limits
        const dailyMaterialsLimit = userData.quota?.dailyMaterialsLimit || 5;
        const dailyImagesLimit = userData.quota?.dailyImagesLimit || 2;

        // Fetch current daily usage
        const usageRef = adminDb.doc(getUsagePath(user.userId, today));
        const usageDoc = await usageRef.get();

        const currentUsage = usageDoc.exists
          ? usageDoc.data()!
          : {
              materialsGenerated: 0,
              imagesGenerated: 0,
              quizzesCreated: 0,
            };

        // Calculate remaining quota
        const materialsUsed = currentUsage.materialsGenerated || 0;
        const imagesUsed = currentUsage.imagesGenerated || 0;
        const quizzesUsed = currentUsage.quizzesCreated || 0;

        const materialsRemaining = isPremium
          ? 'unlimited'
          : Math.max(0, dailyMaterialsLimit - materialsUsed);
        const imagesRemaining = isPremium
          ? 'unlimited'
          : Math.max(0, dailyImagesLimit - imagesUsed);

        return NextResponse.json({
          success: true,
          usage: {
            materials: {
              used: materialsUsed,
              limit: isPremium ? 'unlimited' : dailyMaterialsLimit,
              remaining: materialsRemaining,
            },
            images: {
              used: imagesUsed,
              limit: isPremium ? 'unlimited' : dailyImagesLimit,
              remaining: imagesRemaining,
            },
            quizzes: {
              used: quizzesUsed,
              limit: isPremium ? 'unlimited' : dailyMaterialsLimit,
              remaining: isPremium ? 'unlimited' : Math.max(0, dailyMaterialsLimit - quizzesUsed),
            },
          },
          subscriptionTier,
          isPremium,
          date: today,
        });
      } catch (error: any) {
        console.error('[API] Error fetching daily usage:', error);
        Sentry.captureException(error, {
          tags: { endpoint: 'usage-daily' },
        });

        return NextResponse.json(
          { error: 'Failed to fetch usage data' },
          { status: 500 }
        );
      }
    }
  );
}
