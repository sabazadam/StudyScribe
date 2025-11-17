'use client';

interface TranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string;
}

export default function TranscriptModal({ isOpen, onClose, transcript }: TranscriptModalProps) {
  if (!isOpen) return null;

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const wordCount = transcript.trim().split(/\s+/).length;
  const charCount = transcript.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Lecture Transcript
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters
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
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-gray-700 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {transcript || 'No transcript available'}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download Transcript
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
