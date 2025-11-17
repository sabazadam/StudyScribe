'use client';

interface CreateAnotherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: string) => void;
}

const materialTypes = [
  { id: 'exam', label: 'Exam Prep', icon: 'school', color: 'from-purple-500 to-purple-600' },
  { id: 'summary', label: 'Summary', icon: 'summarize', color: 'from-blue-500 to-blue-600' },
  { id: 'quiz', label: 'Quiz', icon: 'quiz', color: 'from-green-500 to-green-600' },
  { id: 'mock-exam', label: 'Mock Exam', icon: 'assignment', color: 'from-orange-500 to-orange-600' },
  { id: 'explain', label: 'Explain', icon: 'psychology', color: 'from-pink-500 to-pink-600' },
  { id: 'custom', label: 'Custom', icon: 'edit_note', color: 'from-indigo-500 to-indigo-600' },
];

export default function CreateAnotherModal({ isOpen, onClose, onSelectType }: CreateAnotherModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Create Another Study Material
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Reusing your uploaded content to generate a different type of material
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
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
                  className="group relative p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-white hover:to-gray-50 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${type.color} flex items-center justify-center transform group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-white text-3xl">
                        {type.icon}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
