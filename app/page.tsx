'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FileUploader from '@/components/ui/FileUploader';
import SlideUploader from '@/components/ui/SlideUploader';
import ImageUploader from '@/components/ui/ImageUploader';
import ProcessingProgress from '@/components/ui/ProcessingProgress';
import ActionButtons from '@/components/ui/ActionButtons';
import ChatMessage from '@/components/ui/ChatMessage';
import FeedbackWidget from '@/components/ui/FeedbackWidget';
import { fileToBase64, extractSlideContent, analyzeImageContent } from '@/lib/fileProcessing';

interface MaterialFile {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: 'audio' | 'video' | 'slide' | 'photo';
  size: number;
  uploadedAt: string;
}

interface LectureMaterial {
  id: string;
  instructorName: string;
  week: number;
  lectureNumber: number;
  audioFiles: MaterialFile[];
  slideFiles: MaterialFile[];
  photoFiles: MaterialFile[];
  uploadedAt: string;
  updatedAt: string;
}

export default function Home() {
  // File states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [slideFiles, setSlideFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  // Pre-uploaded materials states
  const [usePreUploaded, setUsePreUploaded] = useState(false);
  const [instructors, setInstructors] = useState<string[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [availableLectures, setAvailableLectures] = useState<number[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<number | null>(null);
  const [materials, setMaterials] = useState<LectureMaterial[]>([]);

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState({
    transcription: { status: 'idle' as 'idle' | 'loading' | 'success' | 'error' | 'skipped', message: '' },
    slideExtraction: { status: 'idle' as 'idle' | 'loading' | 'success' | 'error' | 'skipped', message: '' },
    imageAnalysis: { status: 'idle' as 'idle' | 'loading' | 'success' | 'error' | 'skipped', message: '' },
  });

  // Output states
  const [outputType, setOutputType] = useState('exam');
  const [customPrompt, setCustomPrompt] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  // Load materials data
  useEffect(() => {
    if (usePreUploaded) {
      loadInstructors();
    }
  }, [usePreUploaded]);

  useEffect(() => {
    if (selectedInstructor) {
      loadMaterialsForInstructor(selectedInstructor);
    }
  }, [selectedInstructor]);

  useEffect(() => {
    if (selectedWeek !== null) {
      const lectures = materials
        .filter(m => m.instructorName === selectedInstructor && m.week === selectedWeek)
        .map(m => m.lectureNumber)
        .sort((a, b) => a - b);
      setAvailableLectures(lectures);
    }
  }, [selectedWeek, materials, selectedInstructor]);

  useEffect(() => {
    if (selectedLecture !== null) {
      loadMaterialFiles();
    }
  }, [selectedLecture]);

  const loadInstructors = async () => {
    try {
      const response = await fetch('/api/materials?action=instructors');
      const data = await response.json();
      if (data.success) {
        setInstructors(data.instructors);
      }
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const loadMaterialsForInstructor = async (instructor: string) => {
    try {
      const response = await fetch('/api/materials');
      const data = await response.json();
      if (data.success) {
        const instructorMaterials = data.materials.filter(
          (m: LectureMaterial) => m.instructorName === instructor
        );
        setMaterials(instructorMaterials);

        const weeksSet = new Set<number>(instructorMaterials.map((m: LectureMaterial) => m.week));
        const weeks = Array.from(weeksSet).sort((a, b) => a - b);
        setAvailableWeeks(weeks);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const loadMaterialFiles = async () => {
    const material = materials.find(
      m => m.instructorName === selectedInstructor &&
           m.week === selectedWeek &&
           m.lectureNumber === selectedLecture
    );

    if (!material) return;

    // Convert pre-uploaded files to File objects
    const loadedAudioFiles: File[] = [];
    const loadedSlideFiles: File[] = [];
    const loadedPhotoFiles: File[] = [];

    try {
      // Load audio files
      for (const file of material.audioFiles) {
        const response = await fetch(file.filePath);
        const blob = await response.blob();
        const fileObj = new File([blob], file.originalName, { type: blob.type });
        loadedAudioFiles.push(fileObj);
      }

      // Load slide files
      for (const file of material.slideFiles) {
        const response = await fetch(file.filePath);
        const blob = await response.blob();
        const fileObj = new File([blob], file.originalName, { type: blob.type });
        loadedSlideFiles.push(fileObj);
      }

      // Load photo files
      for (const file of material.photoFiles) {
        const response = await fetch(file.filePath);
        const blob = await response.blob();
        const fileObj = new File([blob], file.originalName, { type: blob.type });
        loadedPhotoFiles.push(fileObj);
      }

      // Set files (take first audio file if multiple)
      if (loadedAudioFiles.length > 0) setAudioFile(loadedAudioFiles[0]);
      setSlideFiles(loadedSlideFiles);
      setPhotoFiles(loadedPhotoFiles);
    } catch (error) {
      console.error('Error loading material files:', error);
      setError('Failed to load pre-uploaded materials');
    }
  };

  const handleGenerate = async () => {
    // Validation
    if (!audioFile && slideFiles.length === 0) {
      setError('Please upload at least an audio file or slides');
      return;
    }

    setIsProcessing(true);
    setError('');
    setResult('');

    try {
      // Step 1: Transcription (if audio exists)
      let transcript = '';
      if (audioFile) {
        setProcessingSteps(prev => ({
          ...prev,
          transcription: { status: 'loading', message: 'Transcribing audio...' }
        }));

        const formData = new FormData();
        formData.append('file', audioFile);

        const transcribeResponse = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!transcribeResponse.ok) {
          throw new Error('Transcription failed');
        }

        const transcribeData = await transcribeResponse.json();
        transcript = transcribeData.transcript;

        setProcessingSteps(prev => ({
          ...prev,
          transcription: { status: 'success', message: 'Transcription complete!' }
        }));
      } else {
        setProcessingSteps(prev => ({
          ...prev,
          transcription: { status: 'skipped', message: 'No audio file provided' }
        }));
      }

      // Step 2: Slide Extraction (if slides exist)
      let slideText = '';
      if (slideFiles.length > 0) {
        setProcessingSteps(prev => ({
          ...prev,
          slideExtraction: { status: 'loading', message: 'Extracting slide content...' }
        }));

        try {
          const extractedText = await extractSlideContent(slideFiles);
          slideText = extractedText || '';
          setProcessingSteps(prev => ({
            ...prev,
            slideExtraction: { status: 'success', message: 'Slides extracted!' }
          }));
        } catch (err) {
          setProcessingSteps(prev => ({
            ...prev,
            slideExtraction: { status: 'error', message: 'Slide extraction failed' }
          }));
        }
      } else {
        setProcessingSteps(prev => ({
          ...prev,
          slideExtraction: { status: 'skipped', message: 'No slides provided' }
        }));
      }

      // Step 3: Image Analysis (if photos exist)
      let imageAnalysis = '';
      if (photoFiles.length > 0) {
        setProcessingSteps(prev => ({
          ...prev,
          imageAnalysis: { status: 'loading', message: 'Analyzing photos...' }
        }));

        try {
          const analyzedText = await analyzeImageContent(photoFiles);
          imageAnalysis = analyzedText || '';
          setProcessingSteps(prev => ({
            ...prev,
            imageAnalysis: { status: 'success', message: 'Photos analyzed!' }
          }));
        } catch (err) {
          setProcessingSteps(prev => ({
            ...prev,
            imageAnalysis: { status: 'error', message: 'Photo analysis failed' }
          }));
        }
      } else {
        setProcessingSteps(prev => ({
          ...prev,
          imageAnalysis: { status: 'skipped', message: 'No photos provided' }
        }));
      }

      // Step 4: Generate Materials
      const generateResponse = await fetch('/api/generate-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          slideText,
          imageAnalysis,
          outputType,
          customPrompt: outputType === 'custom' ? customPrompt : undefined,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate materials');
      }

      const generateData = await generateResponse.json();
      setResult(generateData.content);
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setAudioFile(null);
    setSlideFiles([]);
    setPhotoFiles([]);
    setResult('');
    setError('');
    setProcessingSteps({
      transcription: { status: 'idle', message: '' },
      slideExtraction: { status: 'idle', message: '' },
      imageAnalysis: { status: 'idle', message: '' },
    });
    setUsePreUploaded(false);
    setSelectedInstructor('');
    setSelectedWeek(null);
    setSelectedLecture(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LectureHelper AI
            </h1>
            <div className="flex gap-3">
              <Link
                href="/materials"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">upload</span>
                Instructors: Upload Materials
              </Link>
              <Link
                href="/hub"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">folder</span>
                Study Hub
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Transform Your Lectures into Study Materials
            </h2>
            <p className="text-lg text-gray-600">
              Upload audio, slides, and photos to generate comprehensive study guides powered by AI
            </p>
          </div>

          {/* Pre-uploaded Materials Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-600">school</span>
                  Use Pre-uploaded Course Materials
                </h3>
                <p className="text-gray-600 mt-1">
                  Select materials your instructor has already uploaded
                </p>
              </div>
              <button
                onClick={() => setUsePreUploaded(!usePreUploaded)}
                className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${
                  usePreUploaded ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform ${
                    usePreUploaded ? 'translate-x-12' : 'translate-x-1'
                  }`}
                >
                  {usePreUploaded && (
                    <span className="material-symbols-outlined text-purple-600 text-center leading-10">
                      check
                    </span>
                  )}
                </span>
              </button>
            </div>

            {usePreUploaded ? (
              <div className="space-y-4 mt-6">
                {/* Instructor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    1. Select Instructor
                  </label>
                  <select
                    value={selectedInstructor}
                    onChange={(e) => {
                      setSelectedInstructor(e.target.value);
                      setSelectedWeek(null);
                      setSelectedLecture(null);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Choose an instructor...</option>
                    {instructors.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* Week Selection */}
                {selectedInstructor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      2. Select Week
                    </label>
                    <select
                      value={selectedWeek ?? ''}
                      onChange={(e) => {
                        setSelectedWeek(Number(e.target.value));
                        setSelectedLecture(null);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Choose a week...</option>
                      {availableWeeks.map((week) => (
                        <option key={week} value={week}>Week {week}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Lecture Selection */}
                {selectedWeek !== null && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      3. Select Lecture
                    </label>
                    <select
                      value={selectedLecture ?? ''}
                      onChange={(e) => setSelectedLecture(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Choose a lecture...</option>
                      {availableLectures.map((lecture) => (
                        <option key={lecture} value={lecture}>Lecture {lecture}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedLecture !== null && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <p className="text-green-800 flex items-center gap-2">
                      <span className="material-symbols-outlined">check_circle</span>
                      Materials loaded! You can now generate your study materials below.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined">info</span>
                  Why use pre-uploaded materials?
                </h4>
                <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                  <li>Save time - no need to upload files yourself</li>
                  <li>Access official course materials from your instructor</li>
                  <li>Get consistent study materials for your entire class</li>
                </ul>
              </div>
            )}
          </div>

          {/* Manual Upload Section */}
          {!usePreUploaded && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">cloud_upload</span>
                Or Upload Your Own Files
              </h3>

              <div className="space-y-6">
                {/* Audio/Video Upload */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-blue-600">videocam</span>
                    <h4 className="text-lg font-semibold">Audio/Video Recording</h4>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                      Required
                    </span>
                  </div>
                  <FileUploader onFileSelect={setAudioFile} />
                </div>

                {/* Slides Upload */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-purple-600">description</span>
                    <h4 className="text-lg font-semibold">Lecture Slides</h4>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                      Optional
                    </span>
                  </div>
                  <SlideUploader onFilesSelect={setSlideFiles} />
                </div>

                {/* Photos Upload */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-green-600">image</span>
                    <h4 className="text-lg font-semibold">Lecture Photos</h4>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                      Optional
                    </span>
                  </div>
                  <ImageUploader onImagesSelect={setPhotoFiles} />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(audioFile || slideFiles.length > 0) && !result && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <ActionButtons
                onActionSelect={(action) => {
                  setOutputType(action);
                  if (action !== 'custom') {
                    handleGenerate();
                  }
                }}
                disabled={isProcessing}
                loading={isProcessing}
              />

              {outputType === 'custom' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Request
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="e.g., 'Create flashcards focusing on key definitions' or 'Explain this using simple analogies'"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={isProcessing || !customPrompt.trim()}
                    className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    {isProcessing ? 'Processing...' : 'Generate with Custom Prompt'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <div className="mb-8">
              <ProcessingProgress
                tasks={[
                  {
                    id: 'transcription',
                    label: 'Transcribing Audio',
                    icon: 'videocam',
                    status: processingSteps.transcription.status === 'idle' ? 'pending' :
                            processingSteps.transcription.status === 'loading' ? 'processing' :
                            processingSteps.transcription.status === 'success' ? 'completed' :
                            processingSteps.transcription.status === 'error' ? 'error' : 'skipped',
                    message: processingSteps.transcription.message,
                    color: 'bg-blue-500'
                  },
                  {
                    id: 'slideExtraction',
                    label: 'Extracting Slides',
                    icon: 'description',
                    status: processingSteps.slideExtraction.status === 'idle' ? 'pending' :
                            processingSteps.slideExtraction.status === 'loading' ? 'processing' :
                            processingSteps.slideExtraction.status === 'success' ? 'completed' :
                            processingSteps.slideExtraction.status === 'error' ? 'error' : 'skipped',
                    message: processingSteps.slideExtraction.message,
                    color: 'bg-purple-500'
                  },
                  {
                    id: 'imageAnalysis',
                    label: 'Analyzing Photos',
                    icon: 'image',
                    status: processingSteps.imageAnalysis.status === 'idle' ? 'pending' :
                            processingSteps.imageAnalysis.status === 'loading' ? 'processing' :
                            processingSteps.imageAnalysis.status === 'success' ? 'completed' :
                            processingSteps.imageAnalysis.status === 'error' ? 'error' : 'skipped',
                    message: processingSteps.imageAnalysis.message,
                    color: 'bg-green-500'
                  }
                ]}
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-800 flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Your Study Materials</h3>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Start New
                </button>
              </div>
              <ChatMessage
                content={result}
                role="assistant"
                timestamp={new Date().toISOString()}
              />
              <div className="mt-6">
                <FeedbackWidget
                  materialType={outputType}
                  onFeedbackSubmit={(rating, comment) => {
                    console.log('Feedback:', { rating, comment, outputType });
                    // You can send this to an API endpoint if needed
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
