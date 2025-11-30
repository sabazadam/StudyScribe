'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ChatMessage from '@/components/ui/ChatMessage';
import FeedbackWidget from '@/components/ui/FeedbackWidget';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [transcript, setTranscript] = useState('');
  const [quiz, setQuiz] = useState<any>(null);
  const [rawExtraction, setRawExtraction] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [error, setError] = useState('');
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollUpDistance, setScrollUpDistance] = useState(0);

  useEffect(() => {
    // Get data from URL params or sessionStorage
    const contentParam = searchParams.get('content');
    const typeParam = searchParams.get('type');
    const transcriptParam = searchParams.get('transcript');

    // Get material type first
    let type = '';
    if (typeParam) {
      type = decodeURIComponent(typeParam);
      setMaterialType(type);
    } else {
      const storedType = sessionStorage.getItem('studyMaterialType');
      if (storedType) {
        type = storedType;
        setMaterialType(storedType);
      }
    }

    // Handle quiz type differently
    if (type === 'quiz') {
      const storedQuiz = sessionStorage.getItem('generatedQuiz');
      if (storedQuiz) {
        try {
          const quizData = JSON.parse(storedQuiz);
          setQuiz(quizData);
        } catch (e) {
          console.error('Failed to parse quiz data:', e);
        }
      }

      // Load raw extraction for regeneration
      const storedExtraction = sessionStorage.getItem('rawExtraction');
      if (storedExtraction) {
        try {
          const extractionData = JSON.parse(storedExtraction);
          setRawExtraction(extractionData);
        } catch (e) {
          console.error('Failed to parse extraction data:', e);
        }
      }
    } else {
      // Regular material flow
      if (contentParam) {
        setContent(decodeURIComponent(contentParam));
      } else {
        const storedContent = sessionStorage.getItem('studyMaterialContent');
        if (storedContent) {
          setContent(storedContent);
        }
      }
    }

    // Load transcript
    if (transcriptParam) {
      setTranscript(decodeURIComponent(transcriptParam));
    } else {
      const storedTranscript = sessionStorage.getItem('studyMaterialTranscript');
      if (storedTranscript) {
        setTranscript(storedTranscript);
      }
    }
  }, [searchParams]);

  // Auto-save quiz materials to Study Hub
  useEffect(() => {
    const autoSaveQuizMaterial = async () => {
      // Only auto-save for quiz type and if not already saved
      if (materialType !== 'quiz' || !quiz || !rawExtraction) return;

      // Check if already saved to avoid duplicates
      const alreadySaved = sessionStorage.getItem('quizMaterialAutoSaved');
      if (alreadySaved === quiz.id) {
        console.log('Quiz material already auto-saved');
        return;
      }

      try {
        console.log('Auto-saving quiz material to Study Hub...');

        const typeLabels = {
          'exam': 'Exam Prep Material',
          'summary': 'Summary',
          'quiz': 'Quiz',
          'mock-exam': 'Mock Exam',
          'explain': 'Detailed Explanation',
          'custom': 'Custom Study Material'
        };

        const title = `${typeLabels[materialType] || 'Study Material'} - ${new Date().toLocaleDateString()}`;

        const response = await fetch('/api/study-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            materialType,
            content: `Quiz: ${quiz.title}`,
            transcript: transcript || '',
            rawExtraction,
            linkedQuizzes: [quiz.id],
            sources: {
              hasAudio: !!transcript,
              hasSlides: !!rawExtraction?.slideText,
              hasPhotos: !!rawExtraction?.imageAnalysis
            },
            metadata: {
              wordCount: transcript?.split(/\s+/).length || 0
            }
          })
        });

        if (response.ok) {
          const savedData = await response.json();
          console.log('Quiz material auto-saved successfully:', savedData);
          // Mark as saved to avoid duplicates
          sessionStorage.setItem('quizMaterialAutoSaved', quiz.id);
        } else {
          console.error('Failed to auto-save quiz material');
        }
      } catch (error) {
        console.error('Error auto-saving quiz material:', error);
      }
    };

    autoSaveQuizMaterial();
  }, [quiz, materialType, rawExtraction, transcript]);

  // Scroll detection for toolbar hide/show
  useEffect(() => {
    const SCROLL_UP_THRESHOLD = 120; // Must scroll up 120px to show toolbar

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show toolbar when near the top (within 50px)
      if (currentScrollY < 50) {
        setIsToolbarVisible(true);
        setLastScrollY(currentScrollY);
        setScrollUpDistance(0);
        return;
      }

      // Scrolling down - hide toolbar and reset scroll-up counter
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsToolbarVisible(false);
        setScrollUpDistance(0);
      }
      // Scrolling up - accumulate distance
      else if (currentScrollY < lastScrollY) {
        const scrolledUp = lastScrollY - currentScrollY;
        const newScrollUpDistance = scrollUpDistance + scrolledUp;
        setScrollUpDistance(newScrollUpDistance);

        // Only show toolbar after scrolling up SCROLL_UP_THRESHOLD pixels
        if (newScrollUpDistance >= SCROLL_UP_THRESHOLD) {
          setIsToolbarVisible(true);
          setScrollUpDistance(0); // Reset after showing
        }
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, scrollUpDistance]);

  const handleSaveToHub = async () => {
    // For quiz type, check quiz data; for regular materials, check content
    if ((!content && !quiz) || isSaved) return;

    setIsSaving(true);
    setError('');

    try {
      const typeLabels: Record<string, string> = {
        'exam': 'Exam Prep',
        'summary': 'Summary',
        'quiz': 'Quiz',
        'mock-exam': 'Mock Exam',
        'explain': 'Detailed Explanation',
        'custom': 'Custom Study Material'
      };

      const title = `${typeLabels[materialType] || 'Study Material'} - ${new Date().toLocaleDateString()}`;

      // For quiz type, save the raw extraction with quiz link
      if (materialType === 'quiz' && quiz) {
        console.log('Saving quiz material with quiz ID:', quiz.id);
        console.log('Quiz object:', quiz);

        const response = await fetch('/api/study-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            materialType,
            content: `Quiz: ${quiz.title}`, // Placeholder content
            transcript,
            rawExtraction,
            linkedQuizzes: [quiz.id],
            sources: {
              hasAudio: !!transcript,
              hasSlides: !!rawExtraction?.slideText,
              hasPhotos: !!rawExtraction?.imageAnalysis
            },
            metadata: {
              wordCount: transcript?.split(/\s+/).length || 0
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to save material:', errorData);
          throw new Error('Failed to save material');
        }

        const savedData = await response.json();
        console.log('Material saved successfully:', savedData);
      } else {
        // Regular material save
        const response = await fetch('/api/study-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            materialType,
            content,
            transcript,
            sources: {
              hasAudio: !!transcript,
              hasSlides: false,
              hasPhotos: false
            },
            metadata: {
              wordCount: content.split(/\s+/).length
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save material');
        }
      }

      setIsSaved(true);
    } catch (err: any) {
      console.error('Error saving material:', err);
      setError(err.message || 'Failed to save material to hub');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartQuiz = () => {
    if (quiz) {
      router.push(`/quiz/${quiz.id}`);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-material-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateAnother = () => {
    router.push('/create');
  };

  const handleStartOver = () => {
    // Clear session storage
    sessionStorage.removeItem('studyMaterialContent');
    sessionStorage.removeItem('studyMaterialType');
    sessionStorage.removeItem('studyMaterialTranscript');
    router.push('/create');
  };

  // Check if we have content OR quiz
  if (!content && !quiz) {
    return (
      <div className="min-h-screen bg-mesh-academic pattern-dots flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-oxford-blue/30 mb-4">description</span>
          <h2 className="text-2xl font-heading font-bold text-oxford-blue mb-2">No Content Available</h2>
          <p className="text-text-muted mb-6">Please create study materials first.</p>
          <Link href="/create" className="btn-primary inline-block">
            Create Materials
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-academic pattern-dots">
      {/* Header */}
      <header className="glass dark:glass-dark border-b border-oxford-blue/10 sticky top-0 z-50 shadow-sm backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-heading font-bold text-gradient-academic cursor-pointer hover:opacity-80 transition-opacity">
                LectureHelper AI
              </h1>
            </Link>
            <nav>
              <div className="flex gap-3">
                <Link
                  href="/create"
                  className="px-4 py-2 bg-oxford-blue hover:bg-oxford-blue/90 text-white rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2 font-medium"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span className="hidden md:inline">Create New</span>
                </Link>
                <Link
                  href="/hub"
                  className="px-4 py-2 bg-cerulean hover:bg-cerulean/90 text-white rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2 font-medium"
                >
                  <span className="material-symbols-outlined text-sm">folder</span>
                  <span className="hidden md:inline">Study Hub</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-8 pb-24 max-w-[1400px]">
        <div className="w-full">
          {/* Integrated Action Toolbar - Sticky with scroll behavior */}
          <div className={`sticky top-20 z-40 mb-6 transition-transform duration-300 ${
            isToolbarVisible ? 'translate-y-0' : '-translate-y-full'
          }`}>
            <div className="glass border border-oxford-blue/20 rounded-xl p-4 sm:p-6 shadow-md">
              {/* Header Row: Success Icon + Title + Metadata */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-oxford-blue/10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-success/10 border-2 border-success/30 flex-shrink-0">
                    <span className="material-symbols-outlined text-xl text-success">check_circle</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-heading font-bold text-oxford-blue text-lg leading-tight">
                      {materialType === 'quiz' ? 'Your Quiz Is Ready!' : 'Your Study Materials Are Ready!'}
                    </h2>
                    <p className="text-xs text-text-muted">
                      Generated with AI •
                      {materialType === 'quiz' && quiz ? ` ${quiz.questions.length} questions` : ` ${content.split(/\s+/).length} words`} •
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Transcript Toggle (if available) */}
                {transcript && (
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="btn-ghost-sm flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showTranscript ? 'visibility_off' : 'article'}
                    </span>
                    <span className="hidden md:inline">
                      {showTranscript ? 'Hide' : 'View'} Transcript
                    </span>
                  </button>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Quiz-specific: Start Quiz Now */}
                {materialType === 'quiz' && quiz && (
                  <button
                    onClick={handleStartQuiz}
                    className="btn-primary-sm bg-green-600 hover:bg-green-700"
                  >
                    <span className="material-symbols-outlined text-lg">play_arrow</span>
                    <span>Start Quiz Now</span>
                  </button>
                )}

                {/* Save to Hub */}
                <button
                  onClick={handleSaveToHub}
                  disabled={isSaving || isSaved}
                  className={`btn-primary-sm ${isSaved ? 'btn-success-sm' : ''}`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {isSaving ? 'hourglass_empty' : (isSaved ? 'check_circle' : 'bookmark')}
                  </span>
                  <span>{isSaved ? 'Saved!' : 'Save to Hub'}</span>
                </button>

                {/* Download - only for regular materials */}
                {materialType !== 'quiz' && (
                  <button
                    onClick={handleDownload}
                    className="btn-secondary-sm"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    <span>Download</span>
                  </button>
                )}

                {/* Create Another Material */}
                <button
                  onClick={handleCreateAnother}
                  className="btn-secondary-sm"
                >
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  <span>Create Another</span>
                </button>

                {/* Start Over */}
                <button
                  onClick={handleStartOver}
                  className="btn-ghost-sm"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                  <span className="hidden sm:inline">Start Over</span>
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50/50 border border-amber-500/30 rounded-lg">
                  <span className="material-symbols-outlined text-amber-600 text-lg flex-shrink-0">warning</span>
                  <p className="text-sm text-amber-800 flex-1">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Area - Optimized Width and Spacing */}
          <div className="w-full">
            <div className="card-elevated glass p-6 sm:p-8 lg:p-10 prose-optimized">
            {/* Content Display */}
            {showTranscript && transcript ? (
              <div className="glass border border-oxford-blue/20 rounded-xl p-6 not-prose">
                <h3 className="text-lg font-heading font-bold text-oxford-blue mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-cerulean">article</span>
                  Lecture Transcript
                </h3>
                <div className="text-sm text-oxford-blue/80 whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto custom-scrollbar">
                  {transcript}
                </div>
              </div>
            ) : materialType === 'quiz' && quiz ? (
              /* Quiz Preview */
              <div className="glass border border-oxford-blue/20 rounded-xl p-6 not-prose">
                <h3 className="text-2xl font-heading font-bold text-oxford-blue mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600">quiz</span>
                  {quiz.title}
                </h3>
                {quiz.description && (
                  <p className="text-oxford-blue/70 mb-6">{quiz.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{quiz.questions.length}</div>
                    <div className="text-sm text-blue-700">Questions</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{quiz.difficulty || 'medium'}</div>
                    <div className="text-sm text-purple-700">Difficulty</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-3xl font-bold text-green-600 mb-1">Multiple Choice</div>
                    <div className="text-sm text-green-700">Format</div>
                  </div>
                </div>

                <h4 className="font-semibold text-oxford-blue mb-3">Question Preview:</h4>
                <div className="bg-white rounded-lg p-4 border border-oxford-blue/20 mb-4">
                  <p className="font-medium text-oxford-blue mb-3">{quiz.questions[0]?.question}</p>
                  <div className="space-y-2">
                    {quiz.questions[0]?.options.slice(0, 4).map((option: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-oxford-blue/70">
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-oxford-blue/60 italic">
                  Click &ldquo;Start Quiz Now&rdquo; above to begin taking the quiz!
                </p>
              </div>
            ) : (
              <div className="prose prose-xl dark:prose-invert max-w-none">
                <ChatMessage
                  content={content}
                  role="assistant"
                  timestamp={new Date().toISOString()}
                />
              </div>
            )}

            {/* Feedback Widget */}
            <div className="mt-12 pt-8 border-t border-oxford-blue/10 not-prose">
              <FeedbackWidget
                materialType={materialType}
                onFeedbackSubmit={(rating, comment) => {
                  console.log('Feedback:', { rating, comment, materialType });
                }}
              />
            </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile: Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0
            bg-white/95 backdrop-blur-md border-t border-gray-200
            px-4 py-3 z-50 shadow-lg">
            <div className="flex justify-around gap-2 max-w-2xl mx-auto">

              {/* Save to Hub (Mobile - Icon Only) */}
              <button
                onClick={handleSaveToHub}
                disabled={isSaving || isSaved}
                aria-label={isSaved ? 'Saved!' : 'Save to Hub'}
                title={isSaved ? 'Saved!' : 'Save to Hub'}
                className={`flex items-center justify-center
                  w-12 h-12 rounded-full
                  ${isSaved
                    ? 'bg-success'
                    : 'bg-cerulean active:bg-cerulean/90'
                  }
                  text-white shadow-md active:shadow-lg
                  transition-all duration-150
                  active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {isSaving ? 'hourglass_empty' : (isSaved ? 'check_circle' : 'bookmark')}
                </span>
              </button>

              {/* Download (Mobile - Icon Only) */}
              <button
                onClick={handleDownload}
                aria-label="Download"
                title="Download"
                className="flex items-center justify-center
                  w-12 h-12 rounded-full
                  bg-oxford-blue active:bg-oxford-blue/90
                  text-white shadow-md active:shadow-lg
                  transition-all duration-150
                  active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
              >
                <span className="material-symbols-outlined text-2xl">download</span>
              </button>

              {/* View Transcript (Mobile - Icon Only - Conditional) */}
              {transcript && (
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  aria-label={showTranscript ? 'Hide Transcript' : 'View Transcript'}
                  title={showTranscript ? 'Hide Transcript' : 'View Transcript'}
                  className="flex items-center justify-center
                    w-12 h-12 rounded-full
                    bg-prussian-blue active:bg-prussian-blue/90
                    text-white shadow-md active:shadow-lg
                    transition-all duration-150
                    active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
                >
                  <span className="material-symbols-outlined text-2xl">
                    {showTranscript ? 'visibility_off' : 'article'}
                  </span>
                </button>
              )}

              {/* Create Another (Mobile - Icon Only) */}
              <button
                onClick={handleCreateAnother}
                aria-label="Create Another"
                title="Create Another"
                className="flex items-center justify-center
                  w-12 h-12 rounded-full
                  bg-amber-500 active:bg-amber-600
                  text-white shadow-md active:shadow-lg
                  transition-all duration-150
                  active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
              >
                <span className="material-symbols-outlined text-2xl">add_circle</span>
              </button>

              {/* Start Over (Mobile - Icon Only) */}
              <button
                onClick={handleStartOver}
                aria-label="Start Over"
                title="Start Over"
                className="flex items-center justify-center
                  w-12 h-12 rounded-full
                  bg-gray-500 active:bg-gray-600
                  text-white shadow-md active:shadow-lg
                  transition-all duration-150
                  active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
              >
                <span className="material-symbols-outlined text-2xl">refresh</span>
              </button>
            </div>

        {/* Error Display (Mobile) */}
        {error && (
          <div className="mt-3 glass border border-amber-500/30 bg-amber-50/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
              <p className="text-xs text-amber-800 flex-1">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-mesh-academic pattern-dots flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cerulean mx-auto mb-4"></div>
          <p className="text-oxford-blue font-medium">Loading your materials...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
