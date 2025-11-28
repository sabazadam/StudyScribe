'use client';

import { QuizListItem } from '@/lib/quizTypes';
import { useRouter } from 'next/navigation';

interface QuizCardProps {
  quiz: QuizListItem;
  onDelete?: (id: string) => void;
}

export default function QuizCard({ quiz, onDelete }: QuizCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 flex-1 line-clamp-2">
            {quiz.title}
          </h3>
          {quiz.status === 'draft' && (
            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
              Draft
            </span>
          )}
        </div>

        {quiz.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {quiz.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{quiz.questionCount} questions</span>
          </div>

          {quiz.timeLimit && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTime(quiz.timeLimit)}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(quiz.createdAt)}</span>
          </div>
        </div>

        {/* Performance indicators */}
        {quiz.stats && quiz.stats.attemptCount > 0 && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-blue-600">
                {quiz.stats.bestPercentage}%
              </div>
              <div className="text-xs text-gray-600">Best Score</div>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-gray-700">
                {quiz.stats.attemptCount}
              </div>
              <div className="text-xs text-gray-600">
                {quiz.stats.attemptCount === 1 ? 'Attempt' : 'Attempts'}
              </div>
            </div>
          </div>
        )}

        {quiz.lastAttempt && (
          <div className="text-xs text-gray-500 mb-4">
            Last attempt: {formatDate(quiz.lastAttempt.date)} •
            Score: {quiz.lastAttempt.percentage}%
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex gap-2">
        <button
          onClick={() => router.push(`/quiz/${quiz.id}`)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
        >
          {quiz.stats && quiz.stats.attemptCount > 0 ? 'Retake' : 'Start Quiz'}
        </button>

        {quiz.stats && quiz.stats.attemptCount > 0 && (
          <button
            onClick={() => router.push(`/quiz/${quiz.id}/history`)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
          >
            History
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this quiz?')) {
                onDelete(quiz.id);
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
