/**
 * Quiz CRUD API Routes
 * GET: List all quizzes with optional filters
 * POST: Create new quiz
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllQuizzes,
  getQuizzesByMaterialId,
  searchQuizzes,
  createQuiz,
  getQuizListItems,
} from '@/lib/quizStorage';
import { Quiz } from '@/lib/quizTypes';

/**
 * GET /api/quizzes
 * Query params:
 * - materialId: Filter by material ID
 * - search: Search query
 * - status: Filter by status
 * - summary: Return summary view (for list pages)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const materialId = searchParams.get('materialId');
    const searchQuery = searchParams.get('search');
    const status = searchParams.get('status');
    const summary = searchParams.get('summary') === 'true';

    // Return summary view for list pages
    if (summary) {
      let items = getQuizListItems();

      // Apply filters
      if (materialId) {
        items = items.filter(item => item.materialId === materialId);
      }
      if (status) {
        items = items.filter(item => item.status === status);
      }
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        items = items.filter(item =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery)
        );
      }

      return NextResponse.json({ quizzes: items, count: items.length });
    }

    // Full quiz data
    let quizzes: Quiz[];

    if (searchQuery) {
      quizzes = searchQuizzes(searchQuery);
    } else if (materialId) {
      quizzes = getQuizzesByMaterialId(materialId);
    } else {
      quizzes = getAllQuizzes();
    }

    // Apply status filter
    if (status) {
      quizzes = quizzes.filter(q => q.status === status);
    }

    return NextResponse.json({ quizzes, count: quizzes.length });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quizzes
 * Create new quiz
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.questions || !Array.isArray(body.questions)) {
      return NextResponse.json(
        { error: 'Missing required fields: title, questions' },
        { status: 400 }
      );
    }

    // Validate questions
    if (body.questions.length === 0) {
      return NextResponse.json(
        { error: 'Quiz must have at least one question' },
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

      if (!question.explanation) {
        return NextResponse.json(
          { error: 'Each question must have an explanation' },
          { status: 400 }
        );
      }
    }

    // Add order to questions
    const questionsWithOrder = body.questions.map((q: any, index: number) => ({
      ...q,
      id: q.id || `q-${Date.now()}-${index}`,
      order: index,
    }));

    const newQuiz = createQuiz({
      title: body.title,
      description: body.description,
      questions: questionsWithOrder,
      materialId: body.materialId,
      status: body.status || 'published',
      timeLimit: body.timeLimit,
      passingScore: body.passingScore,
      tags: body.tags || [],
    });

    return NextResponse.json({ quiz: newQuiz }, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}
