'use client';

interface CreateAnotherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: string) => void;
}

const materialTypes = [
  {
    id: 'exam',
    label: 'Exam Prep',
    icon: 'school',
    description: 'Study material for exam'
  },
  {
    id: 'summary',
    label: 'Summary',
    icon: 'summarize',
    description: 'Concise overview'
  },
  {
    id: 'quiz',
    label: 'Quiz',
    icon: 'quiz',
    description: 'Practice questions'
  },
  {
    id: 'mock-exam',
    label: 'Mock Exam',
    icon: 'assignment',
    description: 'Full practice exam'
  },
  {
    id: 'explain',
    label: 'Explain',
    icon: 'psychology',
    description: 'Step-by-step breakdown'
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: 'edit_note',
    description: 'Your own request'
  },
];

export default function CreateAnotherModal({ isOpen, onClose, onSelectType }: CreateAnotherModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-midnight-blue/80 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass dark:glass-dark border border-oxford-blue/20 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in">
          {/* Header */}
          <div className="p-6 border-b border-oxford-blue/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading font-bold text-gradient-academic mb-1">
                  Create Another Study Material
                </h2>
                <p className="text-sm text-text-muted dark:text-text-dark-muted">
                  Reusing your uploaded content to generate a different type
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-oxford-blue/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-oxford-blue dark:text-text-dark">close</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {materialTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    onSelectType(type.id);
                    onClose();
                  }}
                  className="group relative glass border-2 border-oxford-blue/20 rounded-xl p-6
                    hover:border-cerulean hover:shadow-xl
                    transition-all duration-300
                    transform hover:scale-102
                    pattern-dots overflow-hidden
                    focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2
                    text-center"
                >
                  {/* Icon Badge */}
                  <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3
                    bg-cerulean/10 rounded-full border-2 border-cerulean/20
                    group-hover:bg-cerulean/20 group-hover:border-cerulean/30
                    transition-all duration-300">
                    <span className="material-symbols-outlined text-3xl text-cerulean group-hover:scale-110 transition-transform">
                      {type.icon}
                    </span>
                  </div>

                  {/* Label */}
                  <h3 className="font-heading font-bold text-base text-oxford-blue dark:text-text-dark mb-1 group-hover:text-cerulean transition-colors">
                    {type.label}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-text-muted dark:text-text-dark-muted">
                    {type.description}
                  </p>

                  {/* Hover effect accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cerulean/0 to-cerulean/5
                    opacity-0 group-hover:opacity-100 transition-opacity -z-10 rounded-xl" />
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-oxford-blue/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 glass border border-oxford-blue/20 hover:border-oxford-blue/40 text-oxford-blue dark:text-text-dark font-medium rounded-lg transition-all hover:shadow-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
