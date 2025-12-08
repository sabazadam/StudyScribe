/**
 * Quiz CRUD API Routes
 * GET: List user's quizzes with optional filters
 * POST: Create new quiz
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/middleware/authMiddleware';
import {
  saveQuiz,
  getUserQuizzes,
  getQuizById,
  deleteQuiz,
} from '@/lib/firestore/quizRepository';
import { QuizQuestion, MaterialSources } from '@/lib/types/firestore';

/**
 * GET /api/quizzes
 * Query params:
 * - id: Get specific quiz by ID
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const user = await verifyUserAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in to view quizzes.' },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const quizId = searchParams.get('id');

    // Get specific quiz
    if (quizId) {
      const quiz = await getQuizById(quizId, user.userId);
      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found or unauthorized' },
          { status: 404 }
        );
      }
      return NextResponse.json({ quiz });
    }

    // Get all user quizzes
    const quizzes = await getUserQuizzes(user.userId, 50);
    return NextResponse.json({ quizzes, count: quizzes.length });

  } catch (error: any) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quizzes
 * Create new quiz
 */
export async function POST(request: NextRequest) {
  // Verify authentication
  const user = await verifyUserAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in to create quizzes.' },
      { status: 401 }
    );
  }

  // Import atomic quota service
  const { reserveQuota, rollbackReservation, QuotaReservationError } = await import('@/lib/firestore/atomicQuotaService');
  const { getEstimatedCost } = await import('@/lib/firestore/costRepository');

  let reservation = null;

  try {
    const body = await request.json();

    // Import validation schema and helpers
    const { createQuizSchema, validateRequestSafe, sanitizeInput, sanitizeStringArray } = await import('@/lib/validation');

    // ========================================================================
    // ATOMIC QUOTA RESERVATION - BEFORE PROCESSING
    // ========================================================================
    // Reserve quota atomically BEFORE doing any work
    // Quizzes use the 'materials' cost endpoint (quiz generation is similar cost)
    const estimatedCost = getEstimatedCost('generate-materials', 'gemini_flash');

    try {
      reservation = await reserveQuota(
        user.userId,
        'quizzes',
        'generate-materials',
        estimatedCost,
        1 // Reserve 1 quiz slot
      );
      console.log(`[CreateQuiz] Quota reserved successfully for user ${user.userId}, reservation: ${reservation.reservationId}`);
    } catch (quotaError: any) {
      if (quotaError instanceof QuotaReservationError) {
        console.log(`[CreateQuiz] Quota reservation failed for user ${user.userId}:`, quotaError.message);
        return NextResponse.json(
          {
            error: quotaError.message,
            reason: quotaError.reason,
            details: quotaError.details,
          },
          { status: 429 }
        );
      }
      throw quotaError;
    }
    // ========================================================================

    // Validate request body
    const validation = validateRequestSafe(createQuizSchema, body);

    if (!validation.success) {
      console.error('[CreateQuiz] Validation failed:', validation.error);
      return NextResponse.json(
        {
          error: 'Invalid quiz data',
          details: validation.error,
          validationErrors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Use validated data
    const validatedData = validation.data!;

    // Sanitize title and description
    const sanitizedTitle = sanitizeInput(validatedData.title);
    const sanitizedDescription = validatedData.description ? sanitizeInput(validatedData.description) : '';

    // Sanitize and structure questions (already validated by schema)
    const questionsWithOrder: QuizQuestion[] = validatedData.questions.map((q, index: number) => ({
      id: q.id || `q-${Date.now()}-${index}`,
      question: sanitizeInput(q.question),
      options: q.options.map(opt => sanitizeInput(opt)),
      correctAnswer: q.correctAnswer,
      explanation: sanitizeInput(q.explanation),
      points: q.points || 1,
    }));

    // Calculate metadata
    const totalQuestions = questionsWithOrder.length;
    const totalPoints = questionsWithOrder.reduce((sum, q) => sum + q.points, 0);

    // Prepare sources (if provided, already validated)
    const sources: MaterialSources = {
      transcript: validatedData.sources?.transcript,
      slideText: validatedData.sources?.slideText,
      imageAnalysis: validatedData.sources?.imageAnalysis,
    };

    // Save quiz to Firestore
    const quizId = await saveQuiz(user.userId, {
      quiz: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        timeLimit: validatedData.timeLimit,
        questions: questionsWithOrder,
      },
      sources,
      metadata: {
        totalQuestions,
        totalPoints,
        difficulty: validatedData.difficulty,
      },
    });

    console.log('Quiz created with ID:', quizId);

    // Quota already reserved atomically - no post-operation tracking needed

    return NextResponse.json({
      success: true,
      quizId,
      message: 'Quiz created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating quiz:', error);

    // ========================================================================
    // ROLLBACK QUOTA RESERVATION ON FAILURE
    // ========================================================================
    if (reservation) {
      console.log(`[CreateQuiz] Rolling back quota reservation ${reservation.reservationId} for user ${user.userId}`);
      try {
        await rollbackReservation(reservation);
        console.log(`[CreateQuiz] Rollback successful`);
      } catch (rollbackError) {
        console.error(`[CreateQuiz] Rollback failed:`, rollbackError);
      }
    }
    // ========================================================================

    return NextResponse.json(
      { error: 'Failed to create quiz', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quizzes?id={quizId}
 * Delete a quiz
 */
export async function DELETE(request: NextRequest) {
  // Verify authentication
  const user = await verifyUserAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in to delete quizzes.' },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const quizId = searchParams.get('id');

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    await deleteQuiz(quizId, user.userId);

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to delete quiz', details: error.message },
      { status: 500 }
    );
  }
}
