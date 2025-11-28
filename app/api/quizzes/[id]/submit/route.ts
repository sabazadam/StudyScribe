/**
 * Quiz Submission API
 * POST: Submit quiz answers and get score with detailed feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQuizById } from '@/lib/quizStorage';
import { saveAttempt, deleteQuizSession } from '@/lib/quizStorage';
import { QuizAnswer, SubmitQuizResponse } from '@/lib/quizTypes';

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
    const quiz = getQuizById(id);

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Calculate score
    let correctCount = 0;
    const gradedAnswers = body.answers.map((answer: QuizAnswer) => {
      const question = quiz.questions.find(q => q.id === answer.questionId);

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

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = quiz.passingScore ? percentage >= quiz.passingScore : undefined;

    // Save attempt
    const attempt = saveAttempt({
      quizId: id,
      answers: gradedAnswers,
      score: correctCount,
      percentage,
      totalQuestions,
      timeSpent: body.timeSpent,
      passed,
    });

    // Clear quiz session (user finished the quiz)
    deleteQuizSession(id);

    // Prepare detailed response with questions and explanations
    const questionsWithFeedback = quiz.questions.map(question => {
      const userAnswer = body.answers.find((a: QuizAnswer) => a.questionId === question.id);
      const selectedOption = userAnswer ? userAnswer.selectedOption : -1;
      const isCorrect = selectedOption === question.correctAnswer;

      return {
        ...question,
        userAnswer: selectedOption,
        isCorrect,
      };
    });

    const response: SubmitQuizResponse = {
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
