'use client';

import { QuizAttempt, QuizQuestion } from '@/lib/quizTypes';
import { useRouter } from 'next/navigation';

interface QuizResultsProps {
  attempt: QuizAttempt;
  questions: (QuizQuestion & {
    userAnswer: number;
    isCorrect: boolean;
  })[];
  quizTitle: string;
  onRetake?: () => void;
}

export default function QuizResults({ attempt, questions, quizTitle, onRetake }: QuizResultsProps) {
  const router = useRouter();

  // Format time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine pass/fail status
  const isPassed = attempt.passed !== undefined ? attempt.passed : attempt.percentage >= 70;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Score card */}
      <div className={`rounded-lg shadow-lg p-8 mb-8 ${
        isPassed ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-red-50 to-red-100'
      }`}>
        <div className="text-center">
          <div className="mb-4">
            {isPassed ? (
              <div className="inline-block p-4 bg-green-500 rounded-full">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="inline-block p-4 bg-red-500 rounded-full">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isPassed ? 'Congratulations!' : 'Keep Practicing!'}
          </h1>
          <p className="text-lg text-gray-700 mb-6">{quizTitle}</p>

          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {attempt.percentage}%
              </div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {attempt.score}/{attempt.totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {formatTime(attempt.timeSpent)}
              </div>
              <div className="text-sm text-gray-600">Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 mb-8">
        {onRetake && (
          <button
            onClick={onRetake}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Retake Quiz
          </button>
        )}
        <button
          onClick={() => router.push('/quiz')}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Back to Quizzes
        </button>
      </div>

      {/* Question-by-question review */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Your Answers</h2>

        {questions.map((question, index) => {
          const optionLetter = (i: number) => String.fromCharCode(65 + i); // A, B, C, D...

          return (
            <div
              key={question.id}
              className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${
                question.isCorrect ? 'border-green-500' : 'border-red-500'
              }`}
            >
              {/* Question header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Q{index + 1}
                  </span>
                  {question.isCorrect ? (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 font-semibold">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Incorrect
                    </span>
                  )}
                </div>
                {question.difficulty && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {question.difficulty}
                  </span>
                )}
              </div>

              {/* Question text */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {question.question}
              </h3>

              {/* Options */}
              <div className="space-y-2 mb-4">
                {question.options.map((option, optionIndex) => {
                  const isCorrect = optionIndex === question.correctAnswer;
                  const isUserAnswer = optionIndex === question.userAnswer;

                  let bgColor = 'bg-gray-50';
                  let borderColor = 'border-gray-200';
                  let textColor = 'text-gray-700';

                  if (isCorrect) {
                    bgColor = 'bg-green-50';
                    borderColor = 'border-green-500';
                    textColor = 'text-green-900';
                  } else if (isUserAnswer && !isCorrect) {
                    bgColor = 'bg-red-50';
                    borderColor = 'border-red-500';
                    textColor = 'text-red-900';
                  }

                  return (
                    <div
                      key={optionIndex}
                      className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                          isCorrect ? 'bg-green-500 text-white' :
                          isUserAnswer ? 'bg-red-500 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {optionLetter(optionIndex)}
                        </span>
                        <span className={`flex-1 ${textColor}`}>{option}</span>
                        {isCorrect && (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {isUserAnswer && !isCorrect && (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Explanation
                </h4>
                <p className="text-blue-800 text-sm leading-relaxed">{question.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
