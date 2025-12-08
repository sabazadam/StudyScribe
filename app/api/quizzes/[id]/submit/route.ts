/**
 * Quiz Submission API
 * POST: Submit quiz answers and get score with detailed feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQuizById, saveQuizAttempt } from '@/lib/firestore/quizRepository';
// import { deleteQuizSession } from '@/lib/firestore/quizRepository';
import { QuizAnswer, SubmitQuizResponse } from '@/lib/quizTypes';
import { verifyUserAuth } from '@/lib/middleware/authMiddleware';
// TODO: Implement deleteQuizSession in quizRepository

/**
 * POST /api/quizzes/[id]/submit
 * Body: {
 *   answers: QuizAnswer[],
 *   timeSpent: number
 * }
 */
export async function POST(
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
    const body = await request.json();

    // Validate request
    if (!body.answers || !Array.isArray(body.answers)) {
      return NextResponse.json(
        { error: 'Missing or invalid answers array' },
        { status: 400 }
      );
    }

    if (body.timeSpent === undefined || typeof body.timeSpent !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid timeSpent' },
        { status: 400 }
      );
    }

    // Get the quiz
    const quiz = await getQuizById(id, user.userId);

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Calculate score
    let correctCount = 0;
    const questions = quiz.quiz?.questions || [];
    const gradedAnswers = body.answers.map((answer: QuizAnswer) => {
      const question = questions.find(q => q.id === answer.questionId);

      if (!question) {
        return {
          ...answer,
          isCorrect: false,
          timeSpent: answer.timeSpent || 0,
        };
      }

      const isCorrect = answer.selectedOption === question.correctAnswer;
      if (isCorrect) correctCount++;

      return {
        ...answer,
        isCorrect,
        timeSpent: answer.timeSpent || 0,
      };
    });

    const totalQuestions = questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = undefined; // quiz.passingScore ? percentage >= quiz.passingScore : undefined;

    // Convert answers to the expected format (questionId -> selectedOption)
    const answersMap: Record<string, number> = {};
    body.answers.forEach((answer: QuizAnswer) => {
      answersMap[answer.questionId] = answer.selectedOption;
    });

    // Save attempt
    const attemptId = await saveQuizAttempt(user.userId, {
      quizId: id,
      answers: answersMap,
      score: correctCount,
      totalPoints: totalQuestions,
      timeSpent: body.timeSpent,
    });

    const attempt: any = {
      id: attemptId,
      quizId: id,
      userId: user.userId,
      score: correctCount,
      percentage,
      totalQuestions,
      timeSpent: body.timeSpent,
      passed,
      completedAt: new Date().toISOString(),
    };

    // Clear quiz session (user finished the quiz)
    // deleteQuizSession(id); // TODO: Implement deleteQuizSession

    // Prepare detailed response with questions and explanations
    const questionsWithFeedback: any[] = questions.map(question => {
      const userAnswer = body.answers.find((a: QuizAnswer) => a.questionId === question.id);
      const selectedOption = userAnswer ? userAnswer.selectedOption : -1;
      const isCorrect = selectedOption === question.correctAnswer;

      return {
        ...question,
        userAnswer: selectedOption,
        isCorrect,
      };
    });

    const response: any = {
      attempt,
      questions: questionsWithFeedback,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
