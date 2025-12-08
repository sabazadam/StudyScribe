'use client';

import { useState, useEffect } from 'react';
import { SavedStudyMaterial, materialsToSavedMaterials } from '@/lib/types/materialCompat';
import { Material } from '@/lib/types/firestore';
import { useRouter } from 'next/navigation';

interface GenerateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMaterialId?: string;
}

export default function GenerateQuizModal({
  isOpen,
  onClose,
  preselectedMaterialId,
}: GenerateQuizModalProps) {
  const router = useRouter();
  const [materials, setMaterials] = useState<SavedStudyMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(preselectedMaterialId || '');
  const [quizTitle, setQuizTitle] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMaterials();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedMaterialId) {
      setSelectedMaterialId(preselectedMaterialId);
      // Auto-fill title from material
      const material = materials.find(m => m.id === preselectedMaterialId);
      if (material && !quizTitle) {
        setQuizTitle(`Quiz: ${material.title}`);
      }
    }
  }, [preselectedMaterialId, materials]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/study-materials');
      const data = await response.json();

      if (data.success && data.materials) {
        // Convert Firestore Materials to legacy SavedStudyMaterial format
        const firestoreMaterials: Material[] = data.materials;
        const savedMaterials = materialsToSavedMaterials(firestoreMaterials);
        setMaterials(savedMaterials);
      } else {
        setMaterials([]);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      setError('Failed to load study materials');
    }
  };

  const handleGenerate = async () => {
    if (!selectedMaterialId) {
      setError('Please select a study material');
      return;
    }

    if (!quizTitle.trim()) {
      setError('Please enter a quiz title');
      return;
    }

    if (questionCount < 1 || questionCount > 50) {
      setError('Question count must be between 1 and 50');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Get the selected material
      const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
      if (!selectedMaterial) {
        throw new Error('Selected material not found');
      }

      // Prepare content for quiz generation
      const content = `${selectedMaterial.content}\n\n${selectedMaterial.transcript}`;

      // Generate quiz
      const response = await fetch('/api/quizzes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId: selectedMaterialId,
          content,
          title: quizTitle,
          questionCount,
          difficulty,
          modelTier: 'better', // Use pro model for better quality
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quiz');
      }

      const data = await response.json();

      // Close modal and navigate to the new quiz
      onClose();
      router.push(`/quiz/${data.quiz.id}`);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Generate Quiz</h2>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-800 font-semibold">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Select Material */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Study Material *
            </label>
            <select
              value={selectedMaterialId}
              onChange={(e) => {
                setSelectedMaterialId(e.target.value);
                // Auto-fill title when material selected
                const material = materials.find(m => m.id === e.target.value);
                if (material && !quizTitle) {
                  setQuizTitle(`Quiz: ${material.title}`);
                }
              }}
              disabled={isGenerating}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Choose a study material...</option>
              {materials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.title} ({material.materialType})
                </option>
              ))}
            </select>
          </div>

          {/* Quiz Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g., Introduction to Algorithms Quiz"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Questions (1-50)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
              disabled={isGenerating}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-sm text-gray-500 mt-1">More questions will take longer to generate</p>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  disabled={isGenerating}
                  className={`px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    difficulty === level
                      ? level === 'easy'
                        ? 'bg-green-600 text-white'
                        : level === 'medium'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedMaterialId || !quizTitle.trim()}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
