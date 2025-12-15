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

import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { authenticatedPost, authenticatedFormPost, authenticatedFetch } from '@/lib/api/client';
import { useAuth } from '@/components/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface TranscriptionResult {
  transcript: string;
  transcriptId?: string;
  duration?: number;
  wordCount: number;
  language?: string;
  audioFileName?: string;
}

interface SavedTranscript {
  id: string;
  title: string;
  audioFileName: string;
  duration?: number;
  wordCount: number;
  linkedMaterialCount: number;
  createdAt: string;
}

// Transcription progress stages
type TranscriptionStage = 'idle' | 'uploading' | 'converting' | 'transcribing' | 'saving' | 'complete';

// Fun tips to show during transcription
const TRANSCRIPTION_TIPS = [
  "🎓 Did you know? Audio transcription accuracy has improved 40% in the last 3 years!",
  "💡 Tip: Shorter audio files transcribe faster and more accurately.",
  "📚 Fun fact: The average person speaks about 150 words per minute.",
  "🎯 Pro tip: Clear audio without background noise produces the best results.",
  "🧠 Study hack: Re-reading transcripts within 24 hours improves retention by 80%.",
  "✨ CrammingAI can turn this transcript into flashcards, summaries, and quizzes!",
  "🎵 Background music in recordings can reduce transcription accuracy.",
  "📖 Lecture recordings are one of the most effective study resources.",
  "⚡ Our AI is processing your audio at ~10x real-time speed!",
  "🌟 Transcripts are searchable - find that perfect quote instantly.",
];

export default function TranscribePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [file, setFile] = useState<File | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Progress UI state
  const [transcriptionStage, setTranscriptionStage] = useState<TranscriptionStage>('idle');
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  // New: Saved transcripts state
  const [savedTranscripts, setSavedTranscripts] = useState<SavedTranscript[]>([]);
  const [loadingTranscripts, setLoadingTranscripts] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  // Rotate tips during transcription
  useEffect(() => {
    if (!transcribing) return;
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % TRANSCRIPTION_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [transcribing]);

  // Animate progress bar during transcription
  useEffect(() => {
    if (!transcribing) {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setProgress(prev => {
        // Slow down as we approach 90% (never reach 100 until done)
        if (prev < 30) return prev + 2;
        if (prev < 60) return prev + 1;
        if (prev < 85) return prev + 0.5;
        return prev + 0.1;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [transcribing]);

  // Load saved transcripts on mount
  useEffect(() => {
    if (user) {
      loadSavedTranscripts();
    }
  }, [user]);

  const loadSavedTranscripts = async () => {
    setLoadingTranscripts(true);
    try {
      const response = await authenticatedFetch('/api/transcripts?limit=10');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSavedTranscripts(data.data.transcripts || []);
        }
      }
    } catch (err) {
      console.error('Error loading transcripts:', err);
    } finally {
      setLoadingTranscripts(false);
    }
  };

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
    setTranscriptionStage('uploading');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('audio', file);

      // Update stage to transcribing after a brief moment
      setTimeout(() => setTranscriptionStage('transcribing'), 1500);

      // Add auto-save query parameter if enabled
      const url = autoSave ? '/api/transcribe?save=true' : '/api/transcribe';
      const response = await authenticatedFormPost(url, formData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      setTranscriptionStage('saving');
      const data = await response.json();

      if (data.transcript) {
        setProgress(100);
        setTranscriptionStage('complete');

        setTranscriptionResult({
          transcript: data.transcript,
          transcriptId: data.transcriptId,
          duration: data.metadata?.duration,
          wordCount: data.transcript.split(/\s+/).length,
          language: data.metadata?.language,
          audioFileName: data.metadata?.audioFileName || file.name,
        });

        // Refresh saved transcripts if auto-saved
        if (data.transcriptId) {
          loadSavedTranscripts();
        }
      } else {
        throw new Error('No transcript received');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to transcribe audio');
      setTranscriptionStage('idle');
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

  // Save transcript to transcripts collection (NOT study materials)
  const handleSaveTranscript = async () => {
    if (!transcriptionResult || !user) return;

    // If already auto-saved, just refresh the list
    if (transcriptionResult.transcriptId) {
      loadSavedTranscripts();
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await authenticatedPost('/api/transcripts', {
        title: `Transcript - ${file?.name || 'Audio File'}`,
        transcript: transcriptionResult.transcript,
        audioFileName: transcriptionResult.audioFileName || file?.name || 'audio',
        duration: transcriptionResult.duration,
        language: transcriptionResult.language,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save transcript');
      }

      const data = await response.json();

      // Update the transcription result with the new ID
      if (data.data?.transcriptId) {
        setTranscriptionResult({
          ...transcriptionResult,
          transcriptId: data.data.transcriptId,
        });
        loadSavedTranscripts();
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

              {/* Auto-Save Toggle */}
              {file && !transcriptionResult && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">save</span>
                    <span className="text-sm font-medium text-oxford-blue dark:text-text-dark">
                      Auto-save transcript
                    </span>
                  </div>
                  <button
                    onClick={() => setAutoSave(!autoSave)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoSave ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSave ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              )}

              {/* Transcribe Button */}
              {file && !transcriptionResult && !transcribing && (
                <button
                  onClick={handleTranscribe}
                  disabled={transcribing || !user}
                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">mic</span>
                    <span>Start Transcription</span>
                  </div>
                </button>
              )}

              {/* Transcription Progress UI */}
              {transcribing && (
                <div className="space-y-4">
                  {/* Progress Card */}
                  <div className="bg-gradient-to-br from-cerulean/5 to-primary/5 dark:from-cerulean/10 dark:to-primary/10 rounded-xl p-6 border border-cerulean/20">
                    {/* Status Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-cerulean/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-cerulean animate-pulse">
                            {transcriptionStage === 'uploading' && 'cloud_upload'}
                            {transcriptionStage === 'converting' && 'sync'}
                            {transcriptionStage === 'transcribing' && 'hearing'}
                            {transcriptionStage === 'saving' && 'save'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-oxford-blue dark:text-text-dark">
                          {transcriptionStage === 'uploading' && '📤 Uploading audio...'}
                          {transcriptionStage === 'converting' && '🔄 Converting audio format...'}
                          {transcriptionStage === 'transcribing' && '🎧 AI is transcribing...'}
                          {transcriptionStage === 'saving' && '💾 Finalizing...'}
                        </p>
                        <p className="text-sm text-text-muted dark:text-text-dark-muted">
                          {transcriptionStage === 'uploading' && 'Sending your file to our servers'}
                          {transcriptionStage === 'converting' && 'Optimizing audio for best results'}
                          {transcriptionStage === 'transcribing' && 'This may take a moment depending on file length'}
                          {transcriptionStage === 'saving' && 'Almost done!'}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cerulean to-primary rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                    <p className="text-right text-sm text-text-muted dark:text-text-dark-muted mt-2">
                      {Math.round(progress)}%
                    </p>
                  </div>

                  {/* Tips Card */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/50">
                    <p className="text-amber-800 dark:text-amber-200 text-sm transition-opacity duration-500">
                      {TRANSCRIPTION_TIPS[currentTip]}
                    </p>
                  </div>
                </div>
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

                  {/* Actions */}
                  <div className="border-t border-border-light dark:border-border-dark pt-4">
                    <div className="flex flex-wrap gap-2">
                      {/* Save Transcript Button */}
                      {!transcriptionResult.transcriptId && (
                        <button
                          onClick={handleSaveTranscript}
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
                              <span>Save Transcript</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Already Saved Badge */}
                      {transcriptionResult.transcriptId && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          <span className="text-sm font-medium">Saved to Transcripts</span>
                        </div>
                      )}

                      {/* Generate Study Material Button */}
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

        {/* Saved Transcripts Section */}
        {user && savedTranscripts.length > 0 && (
          <div className="card-elevated glass p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold text-oxford-blue dark:text-text-dark flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">folder_open</span>
                My Transcripts
              </h2>
              <span className="text-sm text-text-muted dark:text-text-dark-muted">
                {savedTranscripts.length} saved
              </span>
            </div>

            {loadingTranscripts ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {savedTranscripts.map((transcript) => (
                  <div
                    key={transcript.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-oxford-blue dark:text-text-dark truncate">
                        {transcript.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-text-muted dark:text-text-dark-muted mt-1">
                        <span>{transcript.wordCount.toLocaleString()} words</span>
                        {transcript.duration && (
                          <span>{Math.round(transcript.duration)}s</span>
                        )}
                        {transcript.linkedMaterialCount > 0 && (
                          <span className="bg-cerulean/10 text-cerulean px-2 py-0.5 rounded-full">
                            {transcript.linkedMaterialCount} material{transcript.linkedMaterialCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          // Use this transcript for material creation
                          sessionStorage.setItem('transcriptContent', transcript.title);
                          sessionStorage.setItem('transcriptId', transcript.id);
                          router.push('/create?from=transcript');
                        }}
                        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        title="Use for material creation"
                      >
                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
