/**
 * Quiz Attempts History API
 * GET: Get attempt history for a quiz
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQuizAttempts, getQuizProgress } from '@/lib/quizStorage';

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
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit');
    const includeProgress = searchParams.get('includeProgress') !== 'false';

    // Get attempts
    let attempts = getQuizAttempts(id);

    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        attempts = attempts.slice(0, limitNum);
      }
    }

    // Get progress statistics
    const progress = includeProgress ? getQuizProgress(id) : null;

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
