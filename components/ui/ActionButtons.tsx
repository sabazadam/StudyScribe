'use client';

interface ActionOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

interface ActionButtonsProps {
  onActionSelect: (action: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

const actions: ActionOption[] = [
  {
    id: 'exam',
    label: 'Study Material for Exam',
    description: 'Comprehensive exam prep with key concepts, practice questions & tips',
    icon: 'school',
    color: 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
  },
  {
    id: 'summary',
    label: 'Summarize Content',
    description: 'Multi-level summary from brief overview to detailed breakdown',
    icon: 'summarize',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
  },
  {
    id: 'quiz',
    label: 'Quiz',
    description: 'Practice quiz with multiple choice, true/false & short answer',
    icon: 'quiz',
    color: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
  },
  {
    id: 'mock-exam',
    label: 'Mock Exam',
    description: 'Full practice exam with grading rubric & performance analysis',
    icon: 'assignment',
    color: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
  },
  {
    id: 'explain',
    label: 'Explain Part by Part',
    description: 'Step-by-step breakdown of concepts from basics to advanced',
    icon: 'psychology',
    color: 'bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700'
  },
  {
    id: 'custom',
    label: 'Custom Request',
    description: 'Tell us exactly what you want to create',
    icon: 'edit_note',
    color: 'bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
  }
];

export default function ActionButtons({ onActionSelect, disabled = false, loading = false }: ActionButtonsProps) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
        What would you like to create?
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionSelect(action.id)}
            disabled={disabled || loading}
            className={`
              ${action.color}
              text-white rounded-xl p-6
              transition-all duration-200
              transform hover:scale-105 hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
              flex flex-col items-center text-center space-y-3
            `}
          >
            <span className="material-symbols-outlined text-4xl">
              {action.icon}
            </span>
            <div>
              <div className="font-bold text-lg mb-1">
                {action.label}
              </div>
              <div className="text-sm text-white/90">
                {action.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span>Processing your request...</span>
          </div>
        </div>
      )}
    </div>
  );
}
