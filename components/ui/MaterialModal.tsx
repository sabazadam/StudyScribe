'use client';

import { useState } from 'react';
import EnhancedMarkdown from './EnhancedMarkdown';
import { SavedStudyMaterial } from '@/lib/studyMaterialStorage';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: SavedStudyMaterial | null;
  onDelete?: (id: string) => void;
}

export default function MaterialModal({
  isOpen,
  onClose,
  material,
  onDelete
}: MaterialModalProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'transcript'>('content');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !material) return null;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/study-materials?id=${material.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onDelete?.(material.id);
        onClose();
      } else {
        alert('Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    // Create a text file with the content
    const fullContent = `# ${material.title}\n\n${material.content}${
      material.transcript ? `\n\n## Transcript\n\n${material.transcript}` : ''
    }`;

    const blob = new Blob([fullContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${material.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const typeColors = {
    'exam': 'bg-purple-100 text-purple-800',
    'summary': 'bg-blue-100 text-blue-800',
    'quiz': 'bg-green-100 text-green-800',
    'mock-exam': 'bg-orange-100 text-orange-800',
    'explain': 'bg-pink-100 text-pink-800',
    'custom': 'bg-indigo-100 text-indigo-800'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {material.title}
                </h2>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeColors[material.materialType]}`}>
                    {material.materialType.replace('-', ' ')}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(material.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {material.metadata.wordCount} words
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Sources Badges */}
            <div className="flex gap-2">
              {material.sources.hasAudio && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  <span className="material-symbols-outlined text-sm">videocam</span>
                  Audio
                </span>
              )}
              {material.sources.hasSlides && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                  <span className="material-symbols-outlined text-sm">description</span>
                  Slides
                </span>
              )}
              {material.sources.hasPhotos && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                  <span className="material-symbols-outlined text-sm">image</span>
                  Photos
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('content')}
                className={`pb-3 px-2 font-medium transition-colors relative ${
                  activeTab === 'content'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Study Material
                {activeTab === 'content' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
              {material.transcript && (
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`pb-3 px-2 font-medium transition-colors relative ${
                    activeTab === 'transcript'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Transcript
                  {activeTab === 'transcript' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'content' ? (
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <EnhancedMarkdown content={material.content} />
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Lecture Transcript
                </h3>
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-sm">
                  {material.transcript || 'No transcript available'}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Download
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
