'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedMarkdown from './EnhancedMarkdown';
import { SavedStudyMaterial } from '@/lib/types/materialCompat';
import { QuizListItem } from '@/lib/quizTypes';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: SavedStudyMaterial | null;
  onDelete?: (id: string) => void;
  onGenerateQuiz?: (materialId: string) => void;
}

export default function MaterialModal({
  isOpen,
  onClose,
  material,
  onDelete,
  onGenerateQuiz
}: MaterialModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'content' | 'transcript' | 'quizzes'>('content');
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkedQuizzes, setLinkedQuizzes] = useState<QuizListItem[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // MINOR FIX: Reset tab when material changes and doesn't have transcript
  useEffect(() => {
    // When material changes, validate the active tab
    if (activeTab === 'transcript' && material && !material.transcript) {
      // If transcript tab is active but new material has no transcript,
      // switch to content tab
      setActiveTab('content');
    }
  }, [material, activeTab]);

  // Fetch linked quizzes when quizzes tab is active
  useEffect(() => {
    if (activeTab === 'quizzes' && material?.linkedQuizzes && material.linkedQuizzes.length > 0) {
      fetchLinkedQuizzes();
    }
  }, [activeTab, material]);

  const fetchLinkedQuizzes = async () => {
    if (!material?.linkedQuizzes) {
      console.log('No linkedQuizzes found for material:', material?.id);
      return;
    }

    console.log('Fetching linked quizzes for material:', material.id);
    console.log('LinkedQuizzes IDs:', material.linkedQuizzes);

    setLoadingQuizzes(true);
    try {
      // Fetch all quizzes and filter by linked IDs
      const response = await fetch('/api/quizzes?summary=true');
      const data = await response.json();

      console.log('All quizzes from API:', data.quizzes?.map((q: any) => ({ id: q.id, title: q.title })));

      if (data.quizzes) {
        const filtered = data.quizzes.filter((quiz: QuizListItem) =>
          material.linkedQuizzes?.includes(quiz.id)
        );
        console.log('Filtered linked quizzes:', filtered);
        setLinkedQuizzes(filtered);
      }
    } catch (error) {
      console.error('Error fetching linked quizzes:', error);
    } finally {
      setLoadingQuizzes(false);
    }
  };

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
              <button
                onClick={() => setActiveTab('transcript')}
                disabled={!material.transcript}
                title={!material.transcript ? 'No transcript available for this material' : 'View transcript'}
                className={`pb-3 px-2 font-medium transition-colors relative ${
                  activeTab === 'transcript'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                } ${!material.transcript ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Transcript
                {activeTab === 'transcript' && material.transcript && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('quizzes')}
                className={`pb-3 px-2 font-medium transition-colors relative ${
                  activeTab === 'quizzes'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span className="flex items-center gap-1">
                  Quizzes
                  {material.linkedQuizzes && material.linkedQuizzes.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-xs">
                      {material.linkedQuizzes.length}
                    </span>
                  )}
                </span>
                {activeTab === 'quizzes' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'content' ? (
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <EnhancedMarkdown content={material.content} />
              </div>
            ) : activeTab === 'transcript' ? (
              material.transcript ? (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Lecture Transcript
                  </h3>
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-sm">
                    {material.transcript}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-5xl">article_off</span>
                    <div>
                      <p className="font-semibold mb-2">No transcript available for this material.</p>
                      <p className="text-sm mb-4">This material was created without an audio/video source.</p>
                      <button
                        onClick={() => setActiveTab('content')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        View Study Material
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : activeTab === 'quizzes' ? (
              <div>
                {loadingQuizzes ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : linkedQuizzes.length > 0 ? (
                  <div className="space-y-4">
                    {linkedQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                              {quiz.title}
                            </h3>
                            {quiz.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                {quiz.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quiz Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {quiz.questionCount}
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-300">Questions</div>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {quiz.stats?.attemptCount || 0}
                            </div>
                            <div className="text-xs text-purple-700 dark:text-purple-300">Attempts</div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {quiz.stats?.bestPercentage
                                ? `${Math.round(quiz.stats.bestPercentage)}%`
                                : 'N/A'
                              }
                            </div>
                            <div className="text-xs text-green-700 dark:text-green-300">Best Score</div>
                          </div>
                        </div>

                        {/* Last Attempt Info */}
                        {quiz.lastAttempt && (
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Last attempt:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 dark:text-white font-medium">
                                  {new Date(quiz.lastAttempt.date).toLocaleDateString()}
                                </span>
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">
                                  {Math.round(quiz.lastAttempt.percentage)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              router.push(`/quiz/${quiz.id}`);
                              onClose();
                            }}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                            {quiz.stats?.attemptCount ? 'Retake Quiz' : 'Start Quiz'}
                          </button>
                          {quiz.stats && quiz.stats.attemptCount > 0 && (
                            <button
                              onClick={() => {
                                router.push(`/quiz/${quiz.id}/history`);
                                onClose();
                              }}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm">history</span>
                              History
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-4">
                      <span className="material-symbols-outlined text-6xl">quiz</span>
                      <div>
                        <p className="font-semibold mb-2">No quizzes yet</p>
                        <p className="text-sm mb-4">Generate a quiz from this material to test your knowledge</p>
                        {onGenerateQuiz && (
                          <button
                            onClick={() => {
                              onGenerateQuiz(material.id);
                              onClose();
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Generate Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
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
              {onGenerateQuiz && (
                <button
                  onClick={() => {
                    onGenerateQuiz(material.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">quiz</span>
                  Generate Quiz
                </button>
              )}
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
