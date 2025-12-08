/**
 * Individual Quiz API Routes
 * GET: Get quiz by ID (with optional randomization)
 * PATCH: Update quiz
 * DELETE: Delete quiz
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQuizById, deleteQuiz } from '@/lib/firestore/quizRepository';
import { Quiz, QuizQuestion } from '@/lib/quizTypes';
import { verifyUserAuth } from '@/lib/middleware/authMiddleware';
// TODO: Implement updateQuiz in quizRepository

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * GET /api/quizzes/[id]
 * Query params:
 * - randomize: Shuffle questions (true/false)
 * - includeAnswers: Include correct answers and explanations (default: false)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth is optional for GET - quizzes can be accessed by ID directly
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const randomize = searchParams.get('randomize') === 'true';
    const includeAnswers = searchParams.get('includeAnswers') === 'true';

    const quiz = await getQuizById(id, '');

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Create a copy to avoid mutating original
    let responseQuiz: any = { ...quiz };

    // Randomize questions if requested
    if (randomize && quiz.quiz?.questions) {
      responseQuiz.quiz = {
        ...quiz.quiz,
        questions: shuffleArray(quiz.quiz.questions)
      };
    }

    // Remove answers and explanations if not requested
    if (!includeAnswers && responseQuiz.quiz?.questions) {
      responseQuiz.quiz.questions = responseQuiz.quiz.questions.map((q: any) => ({
        ...q,
        correctAnswer: -1, // Hide correct answer
        explanation: '', // Hide explanation
      }));
    }

    return NextResponse.json({ quiz: responseQuiz });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/quizzes/[id]
 * Update quiz
 * TODO: Implement updateQuiz in quizRepository
 */
/* Temporarily disabled until updateQuiz is implemented
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate questions if provided
    if (body.questions) {
      if (!Array.isArray(body.questions) || body.questions.length === 0) {
        return NextResponse.json(
          { error: 'Invalid questions format' },
          { status: 400 }
        );
      }

      // Validate each question
      for (const question of body.questions) {
        if (!question.question || !question.options || !Array.isArray(question.options)) {
          return NextResponse.json(
            { error: 'Invalid question format' },
            { status: 400 }
          );
        }

        if (question.options.length < 2) {
          return NextResponse.json(
            { error: 'Each question must have at least 2 options' },
            { status: 400 }
          );
        }

        if (
          question.correctAnswer === undefined ||
          question.correctAnswer < 0 ||
          question.correctAnswer >= question.options.length
        ) {
          return NextResponse.json(
            { error: 'Invalid correct answer index' },
            { status: 400 }
          );
        }
      }

      // Ensure questions have order
      body.questions = body.questions.map((q: QuizQuestion, index: number) => ({
        ...q,
        order: q.order !== undefined ? q.order : index,
      }));
    }

    const updatedQuiz = updateQuiz(id, body);

    if (!updatedQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ quiz: updatedQuiz });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to update quiz' },
      { status: 500 }
    );
  }
}
*/

/**
 * DELETE /api/quizzes/[id]
 * Delete quiz
 */
export async function DELETE(
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
    await deleteQuiz(id, user.userId);

    return NextResponse.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to delete quiz' },
      { status: 500 }
    );
  }
}
