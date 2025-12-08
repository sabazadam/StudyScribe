/**
 * Quiz Attempts History API
 * GET: Get attempt history for a quiz
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQuizAttempts } from '@/lib/firestore/quizRepository';
import { verifyUserAuth } from '@/lib/middleware/authMiddleware';
// TODO: Implement getQuizProgress in quizRepository

/**
 * GET /api/quizzes/[id]/attempts
 * Query params:
 * - limit: Number of attempts to return (default: all)
 * - includeProgress: Include progress statistics (default: true)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyUserAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const includeProgress = searchParams.get('includeProgress') !== 'false';

    const limitNum = limitParam ? parseInt(limitParam, 10) : 20;

    // Get attempts
    const attempts = await getQuizAttempts(id, user.userId, limitNum);

    // Get progress statistics
    // TODO: Implement getQuizProgress
    const progress = null; // includeProgress ? getQuizProgress(id) : null;

    return NextResponse.json({
      attempts,
      progress,
      count: attempts.length,
    });

  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz attempts' },
      { status: 500 }
    );
  }
}
