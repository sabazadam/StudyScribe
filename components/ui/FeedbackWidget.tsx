'use client';

import { useState } from 'react';

interface FeedbackWidgetProps {
  materialType: string;
  onFeedbackSubmit: (rating: 'up' | 'down', comment: string) => void;
}

export default function FeedbackWidget({ materialType, onFeedbackSubmit }: FeedbackWidgetProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRatingClick = (selectedRating: 'up' | 'down') => {
    setRating(selectedRating);
    setShowComment(true);
  };

  const handleSubmit = () => {
    if (rating) {
      onFeedbackSubmit(rating, comment);
      setSubmitted(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setRating(null);
        setComment('');
        setShowComment(false);
        setSubmitted(false);
      }, 3000);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-400">
          <span className="material-symbols-outlined text-3xl">check_circle</span>
          <span className="font-semibold text-lg">Thank you for your feedback!</span>
        </div>
        <p className="text-center text-sm text-green-600 dark:text-green-500 mt-2">
          Your input helps us improve our AI-generated study materials.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
      <div className="text-center mb-4">
        <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center justify-center space-x-2">
          <span className="material-symbols-outlined">feedback</span>
          <span>How would you rate this content?</span>
        </h5>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your feedback helps us improve the quality of generated materials
        </p>
      </div>

      <div className="flex items-center justify-center space-x-4 mb-4">
        <button
          onClick={() => handleRatingClick('up')}
          className={`
            flex flex-col items-center space-y-2 px-8 py-4 rounded-xl transition-all duration-200
            ${rating === 'up'
              ? 'bg-green-500 text-white scale-105 shadow-lg'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:scale-105 border border-gray-200 dark:border-gray-700'
            }
          `}
        >
          <span className="material-symbols-outlined text-4xl">thumb_up</span>
          <span className="font-semibold">Helpful</span>
        </button>

        <button
          onClick={() => handleRatingClick('down')}
          className={`
            flex flex-col items-center space-y-2 px-8 py-4 rounded-xl transition-all duration-200
            ${rating === 'down'
              ? 'bg-red-500 text-white scale-105 shadow-lg'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-105 border border-gray-200 dark:border-gray-700'
            }
          `}
        >
          <span className="material-symbols-outlined text-4xl">thumb_down</span>
          <span className="font-semibold">Needs Work</span>
        </button>
      </div>

      {showComment && (
        <div className="mt-4 space-y-3 animate-fadeIn">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {rating === 'up'
              ? 'What did you like? (optional)'
              : 'How can we improve? (optional)'
            }
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={rating === 'up'
              ? 'e.g., Clear explanations, good examples, well-structured...'
              : 'e.g., Missing key concepts, too brief, confusing explanations...'
            }
            className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
            autoFocus
          />

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setRating(null);
                setShowComment(false);
                setComment('');
              }}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
