'use client';

import { useState, useEffect } from 'react';
import { Quiz, QuizAnswer, QuizQuestion } from '@/lib/quizTypes';
import QuizTimer from './QuizTimer';

interface QuizTakerProps {
  quiz: Quiz;
  onSubmit: (answers: QuizAnswer[], timeSpent: number) => void;
  savedSession?: {
    currentQuestionIndex: number;
    answers: QuizAnswer[];
    startTime: number;
  };
}

export default function QuizTaker({ quiz, onSubmit, savedSession }: QuizTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(savedSession?.currentQuestionIndex || 0);
  const [answers, setAnswers] = useState<Map<string, number>>(
    new Map(savedSession?.answers.map(a => [a.questionId, a.selectedOption]) || [])
  );
  const [startTime] = useState(savedSession?.startTime || Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Update question start time when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleOptionSelect = (optionIndex: number) => {
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, optionIndex);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);

    const quizAnswers: QuizAnswer[] = quiz.questions.map(question => ({
      questionId: question.id,
      selectedOption: answers.get(question.id) ?? -1,
      timeSpent: 0, // Individual question time tracking can be added if needed
    }));

    onSubmit(quizAnswers, totalTimeSpent);
  };

  const handleTimeUp = () => {
    // Auto-submit when time runs out
    handleSubmit();
  };

  // Calculate progress
  const answeredCount = Array.from(answers.keys()).length;
  const progressPercentage = (answeredCount / quiz.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with timer and progress */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-sm text-gray-600 mt-1">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </p>
        </div>

        {quiz.timeLimit && (
          <QuizTimer
            totalSeconds={quiz.timeLimit}
            onTimeUp={handleTimeUp}
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{answeredCount} answered</span>
          <span>{quiz.questions.length - answeredCount} remaining</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        {/* Question number indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Q{currentQuestionIndex + 1}
          </span>
          {currentQuestion.difficulty && (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {currentQuestion.difficulty}
            </span>
          )}
        </div>

        {/* Question text */}
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = answers.get(currentQuestion.id) === index;
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {optionLetter}
                  </div>
                  <span className="flex-1 text-gray-900">{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={isFirstQuestion}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <div className="flex gap-2">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-blue-600 text-white'
                  : answers.has(quiz.questions[index].id)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {isLastQuestion ? (
          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Next →
          </button>
        )}
      </div>

      {/* Confirm submit modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Quiz?</h3>
            <p className="text-gray-600 mb-2">
              You have answered {answeredCount} out of {quiz.questions.length} questions.
            </p>
            {answeredCount < quiz.questions.length && (
              <p className="text-amber-600 font-semibold mb-4">
                ⚠️ {quiz.questions.length - answeredCount} question(s) not answered will be marked as incorrect.
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
