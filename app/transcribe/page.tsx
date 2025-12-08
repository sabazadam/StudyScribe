'use client';

/**
 * STANDALONE TRANSCRIPTION PAGE
 * ==============================================================================
 * Dedicated page for audio/video transcription with Whisper AI
 * Features:
 * - File upload (MP3, MP4, WAV, M4A, WEBM)
 * - Real-time transcription progress
 * - Download transcript (TXT, PDF)
 * - Save to materials with folder selection
 * - Link to material creation
 * ==============================================================================
 */

import { useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import FolderPicker from '@/components/folders/FolderPicker';
import { authenticatedPost, authenticatedFormPost } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface TranscriptionResult {
  transcript: string;
  duration?: number;
  wordCount: number;
  language?: string;
}

export default function TranscribePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [file, setFile] = useState<File | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Supported file types
  const SUPPORTED_FORMATS = [
    '.mp3',
    '.mp4',
    '.wav',
    '.m4a',
    '.webm',
    '.mpeg',
    '.mpga',
    '.ogg',
    '.oga',
  ];

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size must be less than 25MB');
      return;
    }

    // Validate file type
    const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_FORMATS.includes(fileExt)) {
      setError(`Unsupported file format. Please use: ${SUPPORTED_FORMATS.join(', ')}`);
      return;
    }

    setFile(selectedFile);
    setError('');
    setTranscriptionResult(null);
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setTranscribing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await authenticatedFormPost('/api/transcribe', formData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();

      if (data.transcript) {
        setTranscriptionResult({
          transcript: data.transcript,
          duration: data.duration,
          wordCount: data.transcript.split(/\s+/).length,
          language: data.language,
        });
      } else {
        throw new Error('No transcript received');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to transcribe audio');
    } finally {
      setTranscribing(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!transcriptionResult) return;

    const blob = new Blob([transcriptionResult.transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToMaterials = async () => {
    if (!transcriptionResult || !user) return;

    setSaving(true);
    setError('');

    try {
      const response = await authenticatedPost('/api/study-materials', {
        title: `Transcript - ${file?.name || 'Audio File'}`,
        materialType: 'custom',
        content: `# Transcript\n\n${transcriptionResult.transcript}`,
        sources: {
          transcript: transcriptionResult.transcript,
        },
        folderId: selectedFolderId,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save transcript');
      }

      const data = await response.json();

      // Navigate to the saved material
      if (data.data?.materialId) {
        router.push(`/hub`);
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save transcript');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMaterial = () => {
    if (!transcriptionResult) return;

    // Store transcript in sessionStorage and navigate to create page
    sessionStorage.setItem('transcriptContent', transcriptionResult.transcript);
    sessionStorage.setItem('transcriptSource', file?.name || 'Audio File');
    router.push('/create?from=transcript');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-mesh-academic dark:bg-mesh-academic-dark p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <h1 className="text-4xl font-heading font-bold text-gradient-academic mb-2">
              Audio Transcription
            </h1>
            <p className="text-text-muted dark:text-text-dark-muted">
              Convert audio or video files to text using AI-powered transcription
            </p>
          </div>

          {/* Upload Section */}
          <div className="card-elevated glass p-6 mb-6">
            <h2 className="text-xl font-heading font-bold text-oxford-blue dark:text-text-dark mb-4">
              Upload Audio File
            </h2>

            <div className="space-y-4">
              {/* File Input */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border-light dark:border-border-dark rounded-lg p-8 text-center cursor-pointer hover:border-primary dark:hover:border-primary transition-all duration-200"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={SUPPORTED_FORMATS.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <span className="material-symbols-outlined text-3xl">audio_file</span>
                    </div>
                    <p className="font-medium text-oxford-blue dark:text-text-dark">
                      {file.name}
                    </p>
                    <p className="text-sm text-text-muted dark:text-text-dark-muted">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setTranscriptionResult(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-text-muted dark:text-text-dark-muted">
                      <span className="material-symbols-outlined text-3xl">upload_file</span>
                    </div>
                    <p className="font-medium text-oxford-blue dark:text-text-dark">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-text-muted dark:text-text-dark-muted">
                      Supported formats: MP3, MP4, WAV, M4A (max 25MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Transcribe Button */}
              {file && !transcriptionResult && (
                <button
                  onClick={handleTranscribe}
                  disabled={transcribing || !user}
                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {transcribing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Transcribing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">mic</span>
                      <span>Start Transcription</span>
                    </div>
                  )}
                </button>
              )}

              {!user && (
                <p className="text-sm text-center text-red-600 dark:text-red-400">
                  Please sign in to use transcription
                </p>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Transcription Result */}
          {transcriptionResult && (
            <div className="space-y-6">
              {/* Result Card */}
              <div className="card-elevated glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-bold text-oxford-blue dark:text-text-dark">
                    Transcript
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-text-muted dark:text-text-dark-muted">
                    {transcriptionResult.wordCount && (
                      <span>{transcriptionResult.wordCount.toLocaleString()} words</span>
                    )}
                    {transcriptionResult.duration && (
                      <span>{Math.round(transcriptionResult.duration)}s</span>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-oxford-blue dark:text-text-dark">
                    {transcriptionResult.transcript}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="card-elevated glass p-6">
                <h3 className="text-lg font-heading font-bold text-oxford-blue dark:text-text-dark mb-4">
                  Save or Download
                </h3>

                <div className="space-y-4">
                  {/* Download Options */}
                  <div>
                    <h4 className="text-sm font-medium text-oxford-blue dark:text-text-dark mb-2">
                      Download Transcript
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadTxt}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Download TXT
                      </button>
                    </div>
                  </div>

                  {/* Save to Materials */}
                  <div className="border-t border-border-light dark:border-border-dark pt-4">
                    <h4 className="text-sm font-medium text-oxford-blue dark:text-text-dark mb-2">
                      Save to Study Materials
                    </h4>

                    <FolderPicker
                      selectedFolderId={selectedFolderId}
                      onSelectFolder={setSelectedFolderId}
                      label="Select Folder (Optional)"
                      placeholder="No folder (save to main hub)"
                    />

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleSaveToMaterials}
                        disabled={saving || !user}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">save</span>
                            <span>Save to Hub</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleCreateMaterial}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        <span>Generate Study Material</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
