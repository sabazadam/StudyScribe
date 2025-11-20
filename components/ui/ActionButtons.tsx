'use client';

interface ActionOption {
  id: string;
  label: string;
  description: string;
  icon: string;
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
    description: 'Comprehensive exam prep with key concepts and practice questions',
    icon: 'school',
  },
  {
    id: 'summary',
    label: 'Summarize Content',
    description: 'Multi-level summary from brief overview to detailed breakdown',
    icon: 'summarize',
  },
  {
    id: 'quiz',
    label: 'Generate Quiz',
    description: 'Practice quiz with multiple choice and short answer questions',
    icon: 'quiz',
  },
  {
    id: 'mock-exam',
    label: 'Mock Exam',
    description: 'Full practice exam with grading rubric and analysis',
    icon: 'assignment',
  },
  {
    id: 'explain',
    label: 'Explain Part by Part',
    description: 'Step-by-step breakdown from basics to advanced concepts',
    icon: 'psychology',
  },
  {
    id: 'custom',
    label: 'Custom Request',
    description: 'Tell us exactly what you want to create',
    icon: 'edit_note',
  }
];

export default function ActionButtons({ onActionSelect, disabled = false, loading = false }: ActionButtonsProps) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-heading font-semibold text-oxford-blue dark:text-white mb-6 text-center">
        What would you like to create?
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionSelect(action.id)}
            disabled={disabled || loading}
            className="group relative glass border-2 border-oxford-blue/20 rounded-xl p-6
              hover:border-cerulean hover:shadow-xl
              transition-all duration-300
              transform hover:scale-102
              pattern-dots overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2
              text-left"
          >
            {/* Icon Badge */}
            <div className="flex items-center justify-center w-14 h-14 mb-4
              bg-cerulean/10 rounded-full border-2 border-cerulean/20
              group-hover:bg-cerulean/20 group-hover:border-cerulean/30
              transition-all duration-300">
              <span className="material-symbols-outlined text-3xl text-cerulean group-hover:scale-110 transition-transform">
                {action.icon}
              </span>
            </div>

            {/* Label */}
            <h3 className="font-heading font-bold text-lg text-oxford-blue dark:text-text-dark mb-2 group-hover:text-cerulean transition-colors">
              {action.label}
            </h3>

            {/* Description */}
            <p className="text-sm text-text-muted dark:text-text-dark-muted leading-relaxed">
              {action.description}
            </p>

            {/* Hover effect accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-cerulean/0 to-cerulean/5
              opacity-0 group-hover:opacity-100 transition-opacity -z-10 rounded-xl" />
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-8 flex items-center justify-center">
          <div className="glass border border-oxford-blue/20 rounded-full px-6 py-3 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cerulean"></div>
            <span className="text-oxford-blue dark:text-text-dark font-medium">Processing your request...</span>
          </div>
        </div>
      )}
    </div>
  );
}
