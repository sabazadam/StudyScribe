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
import CreateAnotherModal from '@/components/ui/CreateAnotherModal';
import TranscriptModal from '@/components/ui/TranscriptModal';
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
    materialGeneration: { status: 'idle' as 'idle' | 'loading' | 'success' | 'error' | 'skipped', message: '' },
  });

  // Output states
  const [outputType, setOutputType] = useState('exam');
  const [customPrompt, setCustomPrompt] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [generatedTranscript, setGeneratedTranscript] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Multi-step flow states
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [cachedExtraction, setCachedExtraction] = useState<{
    transcript: string;
    slideText: string;
    imageAnalysis: string;
  } | null>(null);

  // Modal states
  const [showCreateAnother, setShowCreateAnother] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

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

      // Step 4: Generate Materials with Gemini
      setProcessingSteps(prev => ({
        ...prev,
        materialGeneration: { status: 'loading', message: 'Generating study materials with AI...' }
      }));

      const generateResponse = await fetch('/api/generate-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          slideText,
          imageAnalysis,
          materialType: outputType,
          customPrompt: outputType === 'custom' ? customPrompt : undefined,
        }),
      });

      if (!generateResponse.ok) {
        setProcessingSteps(prev => ({
          ...prev,
          materialGeneration: { status: 'error', message: 'Failed to generate materials' }
        }));
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || 'Failed to generate materials');
      }

      const generateData = await generateResponse.json();

      // Show success state
      setProcessingSteps(prev => ({
        ...prev,
        materialGeneration: { status: 'success', message: 'Materials generated successfully!' }
      }));

      // Wait 1.5 seconds to show the success state, then display results
      await new Promise(resolve => setTimeout(resolve, 1500));

      setResult(generateData.content);
      setGeneratedTranscript(transcript); // Save transcript for later use
      setIsSaved(false); // Reset saved state

      // Cache extracted text for reuse
      setCachedExtraction({
        transcript,
        slideText,
        imageAnalysis
      });

      // Move to results step
      setCurrentStep(4);
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
    setGeneratedTranscript('');
    setIsSaved(false);
    setProcessingSteps({
      transcription: { status: 'idle', message: '' },
      slideExtraction: { status: 'idle', message: '' },
      imageAnalysis: { status: 'idle', message: '' },
      materialGeneration: { status: 'idle', message: '' },
    });
    setUsePreUploaded(false);
    setSelectedInstructor('');
    setSelectedWeek(null);
    setSelectedLecture(null);
  };

  const handleSaveToHub = async () => {
    if (!result || isSaved) return;

    setIsSaving(true);
    setError('');

    try {
      // Generate a title based on output type and date
      const typeLabels = {
        'exam': 'Exam Prep',
        'summary': 'Summary',
        'quiz': 'Quiz',
        'mock-exam': 'Mock Exam',
        'explain': 'Detailed Explanation',
        'custom': 'Custom Study Material'
      };

      const title = `${typeLabels[outputType as keyof typeof typeLabels] || 'Study Material'} - ${new Date().toLocaleDateString()}`;

      // Prepare metadata
      const metadata = {
        audioFileName: audioFile?.name,
        slideFileNames: slideFiles.map(f => f.name),
        photoFileNames: photoFiles.map(f => f.name),
        wordCount: result.split(/\s+/).length
      };

      console.log('Saving material to hub...', { title, materialType: outputType });

      // Save to API
      const response = await fetch('/api/study-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          materialType: outputType,
          content: result,
          transcript: generatedTranscript,
          sources: {
            hasAudio: !!audioFile,
            hasSlides: slideFiles.length > 0,
            hasPhotos: photoFiles.length > 0
          },
          metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save material');
      }

      const data = await response.json();

      if (data.success) {
        console.log('Material saved successfully!', data.material);
        setIsSaved(true);
        // Show success message briefly
        setTimeout(() => {
          // Optionally could redirect to hub or show a notification
        }, 1000);
      } else {
        throw new Error(data.error || 'Failed to save material');
      }
    } catch (err: any) {
      console.error('Error saving material:', err);
      setError(err.message || 'Failed to save material to hub');
    } finally {
      setIsSaving(false);
    }
  };

  // Step navigation handlers
  const handleContinue = () => {
    // Validate files before continuing
    if (!audioFile && slideFiles.length === 0 && photoFiles.length === 0) {
      setError('Please upload at least one file (audio, slides, or photos)');
      return;
    }
    setError('');
    setCurrentStep(2);
  };

  const handleTypeSelection = (type: string) => {
    setOutputType(type);
    setCurrentStep(3);
    // Start processing
    handleGenerate();
  };

  const handleCreateAnother = (type: string) => {
    if (!cachedExtraction) return;

    setOutputType(type);
    setCurrentStep(3);
    setIsProcessing(true);
    setError('');
    setResult('');

    // Generate with cached extraction
    generateWithCachedData(type);
  };

  const generateWithCachedData = async (type: string) => {
    try {
      // Show material generation progress
      setProcessingSteps(prev => ({
        ...prev,
        materialGeneration: { status: 'loading', message: 'Generating study materials with AI...' }
      }));

      const generateResponse = await fetch('/api/generate-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: cachedExtraction?.transcript || '',
          slideText: cachedExtraction?.slideText || '',
          imageAnalysis: cachedExtraction?.imageAnalysis || '',
          materialType: type,
          customPrompt: type === 'custom' ? customPrompt : undefined,
        }),
      });

      if (!generateResponse.ok) {
        setProcessingSteps(prev => ({
          ...prev,
          materialGeneration: { status: 'error', message: 'Failed to generate materials' }
        }));
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || 'Failed to generate materials');
      }

      const generateData = await generateResponse.json();

      // Show success
      setProcessingSteps(prev => ({
        ...prev,
        materialGeneration: { status: 'success', message: 'Materials generated successfully!' }
      }));

      // Wait 1.5 seconds before showing results
      await new Promise(resolve => setTimeout(resolve, 1500));

      setResult(generateData.content);
      setIsSaved(false);
      setCurrentStep(4);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'An error occurred during generation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setResult('');
    setError('');
    setIsSaved(false);
    setAudioFile(null);
    setSlideFiles([]);
    setPhotoFiles([]);
    setCachedExtraction(null);
    setGeneratedTranscript('');
    setProcessingSteps({
      transcription: { status: 'idle', message: '' },
      slideExtraction: { status: 'idle', message: '' },
      imageAnalysis: { status: 'idle', message: '' },
      materialGeneration: { status: 'idle', message: '' },
    });
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

          {/* Step 1: File Upload */}
          {currentStep === 1 && (
          <>
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
                Upload Your Own Files
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

          {/* Continue Button */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <button
              onClick={handleContinue}
              disabled={!audioFile && slideFiles.length === 0 && photoFiles.length === 0}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span>Continue to Select Material Type</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
          </>
          )}

          {/* Step 2: Material Type Selection */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                What type of study material do you want to create?
              </h3>
              <ActionButtons
                onActionSelect={(action) => {
                  if (action === 'custom') {
                    setOutputType(action);
                  } else {
                    handleTypeSelection(action);
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
                    onClick={() => handleTypeSelection('custom')}
                    disabled={isProcessing || !customPrompt.trim()}
                    className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    {isProcessing ? 'Processing...' : 'Generate with Custom Prompt'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Processing Progress */}
          {currentStep === 3 && isProcessing && (
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
                  },
                  {
                    id: 'materialGeneration',
                    label: 'Generating Study Materials',
                    icon: 'auto_awesome',
                    status: processingSteps.materialGeneration.status === 'idle' ? 'pending' :
                            processingSteps.materialGeneration.status === 'loading' ? 'processing' :
                            processingSteps.materialGeneration.status === 'success' ? 'completed' :
                            processingSteps.materialGeneration.status === 'error' ? 'error' : 'skipped',
                    message: processingSteps.materialGeneration.message,
                    color: 'bg-orange-500'
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

          {/* Step 4: Results */}
          {currentStep === 4 && result && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Your Study Materials</h3>
              </div>

              <ChatMessage
                content={result}
                role="assistant"
                timestamp={new Date().toISOString()}
              />

              {/* Action Buttons */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={handleSaveToHub}
                  disabled={isSaving || isSaved}
                  className={`px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                    isSaved
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isSaved ? 'check_circle' : 'save'}
                  </span>
                  {isSaving ? 'Saving...' : isSaved ? 'Saved!' : 'Save to Hub'}
                </button>

                {generatedTranscript && (
                  <button
                    onClick={() => setShowTranscript(true)}
                    className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium border border-blue-200"
                  >
                    <span className="material-symbols-outlined text-sm">article</span>
                    View Transcript
                  </button>
                )}

                <button
                  onClick={() => {
                    const blob = new Blob([result], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `study-material-${new Date().toISOString().split('T')[0]}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium border border-purple-200"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download
                </button>

                <button
                  onClick={() => setShowCreateAnother(true)}
                  className="px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium border border-green-200"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Create Another
                </button>

                <button
                  onClick={handleStartOver}
                  className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium border border-gray-200"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Start Over
                </button>
              </div>

              <div className="mt-6">
                <FeedbackWidget
                  materialType={outputType}
                  onFeedbackSubmit={(rating, comment) => {
                    console.log('Feedback:', { rating, comment, outputType });
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateAnotherModal
        isOpen={showCreateAnother}
        onClose={() => setShowCreateAnother(false)}
        onSelectType={handleCreateAnother}
      />

      <TranscriptModal
        isOpen={showTranscript}
        onClose={() => setShowTranscript(false)}
        transcript={generatedTranscript}
      />
    </div>
  );
}
