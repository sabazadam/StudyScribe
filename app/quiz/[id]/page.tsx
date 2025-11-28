'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QuizTaker from '@/components/quiz/QuizTaker';
import QuizResults from '@/components/quiz/QuizResults';
import { Quiz, QuizAttempt, QuizQuestion, SubmitQuizResponse } from '@/lib/quizTypes';

type ViewState = 'loading' | 'taking' | 'results';

export default function QuizTakingPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [results, setResults] = useState<SubmitQuizResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setViewState('loading');
      const response = await fetch(`/api/quizzes/${quizId}?randomize=true`);

      if (!response.ok) {
        throw new Error('Failed to load quiz');
      }

      const data = await response.json();
      setQuiz(data.quiz);
      setViewState('taking');
    } catch (error) {
      console.error('Error loading quiz:', error);
      setError('Failed to load quiz. Please try again.');
    }
  };

  const handleSubmit = async (answers: any[], timeSpent: number) => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          timeSpent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const data: SubmitQuizResponse = await response.json();
      setResults(data);
      setViewState('results');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    }
  };

  const handleRetake = () => {
    loadQuiz();
  };

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/quiz')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (viewState === 'results' && results && quiz) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <QuizResults
          attempt={results.attempt}
          questions={results.questions}
          quizTitle={quiz.title}
          onRetake={handleRetake}
        />
      </div>
    );
  }

  if (viewState === 'taking' && quiz) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <QuizTaker
          quiz={quiz}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  return null;
}
