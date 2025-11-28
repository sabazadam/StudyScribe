'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FileUploader from '@/components/ui/FileUploader';
import SlideUploader from '@/components/ui/SlideUploader';
import ImageUploader from '@/components/ui/ImageUploader';
import ProcessingProgress from '@/components/ui/ProcessingProgress';
import ActionButtons from '@/components/ui/ActionButtons';
import FeedbackWidget from '@/components/ui/FeedbackWidget';
import CreateAnotherModal from '@/components/ui/CreateAnotherModal';
import TranscriptModal from '@/components/ui/TranscriptModal';
import StepIndicator from '@/components/ui/StepIndicator';
import Tabs from '@/components/ui/Tabs';
import ModelSelector from '@/components/ModelSelector';
import { fileToBase64, extractSlideContent, analyzeImageContent, getLastExtractionErrors, clearExtractionErrors } from '@/lib/fileProcessing';
import { type ModelTier } from '@/lib/models';

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

export default function CreateMaterialsPage() {
  const router = useRouter();

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
  const [selectedModelTier, setSelectedModelTier] = useState<ModelTier>('default');
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

  // Helper function to build detailed error messages from extraction results
  const buildExtractionErrorMessage = (
    audioFile: File | null,
    slideFiles: File[],
    photoFiles: File[],
    processingSteps: {
      transcription: { status: 'idle' | 'loading' | 'success' | 'error' | 'skipped', message: string };
      slideExtraction: { status: 'idle' | 'loading' | 'success' | 'error' | 'skipped', message: string };
      imageAnalysis: { status: 'idle' | 'loading' | 'success' | 'error' | 'skipped', message: string };
      materialGeneration: { status: 'idle' | 'loading' | 'success' | 'error' | 'skipped', message: string };
    }
  ): string => {
    const parts: string[] = [];

    if (audioFile && processingSteps.transcription.status === 'error') {
      parts.push('❌ Audio transcription failed.');
    }

    if (slideFiles.length > 0 && processingSteps.slideExtraction.status === 'error') {
      parts.push('❌ Slide extraction failed - your PDF may be image-based or scanned. Try uploading the pages as images instead.');
    }

    if (photoFiles.length > 0 && processingSteps.imageAnalysis.status === 'error') {
      parts.push('❌ Image analysis failed.');
    }

    // If no specific errors but still no content
    if (parts.length === 0) {
      parts.push('⚠️ No readable content could be extracted from your files.');
      parts.push('');
      parts.push('💡 Suggestions:');
      if (slideFiles.length > 0) {
        parts.push('• If you uploaded a PDF, it may be image-based. Try uploading the pages as images instead.');
      }
      parts.push('• Ensure files contain actual text or clear visual content.');
      parts.push('• Try different file formats (e.g., PPTX instead of PDF).');
    }

    return parts.join('\n');
  };

  const handleGenerate = async () => {
    // Validation
    if (!audioFile && slideFiles.length === 0) {
      setError('Please upload at least an audio file or slides');
      return;
    }

    // CRITICAL FIX: Validate custom prompt before processing
    if (outputType === 'custom' && !customPrompt.trim()) {
      setError('Please enter a custom prompt before generating materials.');
      setCurrentStep(2); // Return to type selection
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

          // Only show success if we got meaningful content
          if (slideText && slideText.trim().length > 50) {
            setProcessingSteps(prev => ({
              ...prev,
              slideExtraction: { status: 'success', message: 'Slides extracted!' }
            }));
          } else if (slideText && slideText.trim().length > 0) {
            setProcessingSteps(prev => ({
              ...prev,
              slideExtraction: { status: 'error', message: 'Minimal content extracted - file may be image-based' }
            }));
          } else {
            setProcessingSteps(prev => ({
              ...prev,
              slideExtraction: { status: 'error', message: 'No text extracted - file may be image-based or scanned' }
            }));
          }
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
          const analyzedText = await analyzeImageContent(photoFiles, selectedModelTier);
          imageAnalysis = analyzedText || '';

          // Only show success if we got meaningful content
          if (imageAnalysis && imageAnalysis.trim().length > 50) {
            setProcessingSteps(prev => ({
              ...prev,
              imageAnalysis: { status: 'success', message: 'Photos analyzed!' }
            }));
          } else if (imageAnalysis && imageAnalysis.trim().length > 0) {
            setProcessingSteps(prev => ({
              ...prev,
              imageAnalysis: { status: 'error', message: 'Minimal content from images - photos may be unclear' }
            }));
          } else {
            setProcessingSteps(prev => ({
              ...prev,
              imageAnalysis: { status: 'error', message: 'No content extracted from images' }
            }));
          }
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

      // PRE-GENERATION VALIDATION: Check if we have any meaningful content
      const hasTranscript = transcript && transcript.trim().length > 50;
      const hasSlideText = slideText && slideText.trim().length > 50;
      const hasImageAnalysis = imageAnalysis && imageAnalysis.trim().length > 50;

      if (!hasTranscript && !hasSlideText && !hasImageAnalysis) {
        // Build detailed error message explaining what failed
        const errorMessage = buildExtractionErrorMessage(
          audioFile,
          slideFiles,
          photoFiles,
          processingSteps
        );

        setProcessingSteps(prev => ({
          ...prev,
          materialGeneration: { status: 'error', message: 'Cannot generate materials - no content extracted' }
        }));

        throw new Error(errorMessage);
      }

      // Step 4: Generate Materials with Gemini
      setProcessingSteps(prev => ({
        ...prev,
        materialGeneration: { status: 'loading', message: 'Generating study materials with AI...' }
      }));

      // Get extraction errors to send to API for better error context
      const extractionErrors = getLastExtractionErrors();

      const generateResponse = await fetch('/api/generate-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          slideText,
          imageAnalysis,
          materialType: outputType,
          customPrompt: outputType === 'custom' ? customPrompt : undefined,
          extractionErrors: extractionErrors.length > 0 ? extractionErrors : undefined,
          modelTier: selectedModelTier,
        }),
      });

      // Clear extraction errors after sending to API
      clearExtractionErrors();

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

      // Wait 1.5 seconds to show the success state, then navigate to results
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Store data in sessionStorage for results page
      sessionStorage.setItem('studyMaterialContent', generateData.content);
      sessionStorage.setItem('studyMaterialType', outputType);
      if (transcript) {
        sessionStorage.setItem('studyMaterialTranscript', transcript);
      }

      // Cache extracted text for reuse
      setCachedExtraction({
        transcript,
        slideText,
        imageAnalysis
      });

      // Navigate to results page
      router.push('/results');
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quiz generation flow - similar to handleGenerate but calls quiz API
  const handleQuizGenerate = async () => {
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

          if (slideText && slideText.trim().length > 50) {
            setProcessingSteps(prev => ({
              ...prev,
              slideExtraction: { status: 'success', message: 'Slides extracted!' }
            }));
          } else if (slideText && slideText.trim().length > 0) {
            setProcessingSteps(prev => ({
              ...prev,
              slideExtraction: { status: 'error', message: 'Minimal content extracted - file may be image-based' }
            }));
          } else {
            setProcessingSteps(prev => ({
              ...prev,
              slideExtraction: { status: 'error', message: 'No text extracted - file may be image-based or scanned' }
            }));
          }
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
          imageAnalysis: { status: 'loading', message: 'Analyzing images...' }
        }));

        try {
          const analysis = await analyzeImageContent(photoFiles);
          imageAnalysis = analysis || '';

          setProcessingSteps(prev => ({
            ...prev,
            imageAnalysis: { status: 'success', message: 'Images analyzed!' }
          }));
        } catch (err) {
          setProcessingSteps(prev => ({
            ...prev,
            imageAnalysis: { status: 'error', message: 'Image analysis failed' }
          }));
        }
      } else {
        setProcessingSteps(prev => ({
          ...prev,
          imageAnalysis: { status: 'skipped', message: 'No photos provided' }
        }));
      }

      // Step 4: Generate Quiz with AI - Enhanced progress feedback
      setProcessingSteps(prev => ({
        ...prev,
        materialGeneration: { status: 'loading', message: 'Analyzing your content...' }
      }));

      const content = `${transcript}\n\n${slideText}\n\n${imageAnalysis}`;

      // Update message after content analysis
      setTimeout(() => {
        setProcessingSteps(prev => ({
          ...prev,
          materialGeneration: { status: 'loading', message: 'Creating intelligent quiz questions...' }
        }));
      }, 1000);

      // Tip about the generation time
      setTimeout(() => {
        setProcessingSteps(prev => ({
          ...prev,
          materialGeneration: { status: 'loading', message: '⏱️ This may take 30-40 seconds for high-quality questions' }
        }));
      }, 3000);

      // Encouraging message
      setTimeout(() => {
        setProcessingSteps(prev => ({
          ...prev,
          materialGeneration: { status: 'loading', message: '💡 Tip: AI-generated quizzes adapt to your content complexity' }
        }));
      }, 8000);

      // Progress update
      setTimeout(() => {
        setProcessingSteps(prev => ({
          ...prev,
          materialGeneration: { status: 'loading', message: '🎯 Crafting questions that test deep understanding...' }
        }));
      }, 15000);

      // Approaching completion
      setTimeout(() => {
        setProcessingSteps(prev => ({
          ...prev,
          materialGeneration: { status: 'loading', message: '✨ Almost there! Finalizing your quiz...' }
        }));
      }, 25000);

      const generateResponse = await fetch('/api/quizzes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          title: `Quiz: ${audioFile?.name || slideFiles[0]?.name || 'Lecture Quiz'}`,
          questionCount: 10,
          difficulty: 'medium',
          modelTier: selectedModelTier,
        }),
      });

      if (!generateResponse.ok) {
        setProcessingSteps(prev => ({
          ...prev,
          materialGeneration: { status: 'error', message: 'Failed to generate quiz' }
        }));
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || 'Failed to generate quiz');
      }

      const generateData = await generateResponse.json();

      setProcessingSteps(prev => ({
        ...prev,
        materialGeneration: { status: 'success', message: 'Quiz generated successfully!' }
      }));

      // Wait 1.5 seconds to show the success state
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Store quiz data in sessionStorage for results page
      sessionStorage.setItem('generatedQuiz', JSON.stringify(generateData.quiz));
      sessionStorage.setItem('studyMaterialType', 'quiz');
      if (transcript) {
        sessionStorage.setItem('studyMaterialTranscript', transcript);
      }

      // Cache extracted text for reuse
      setCachedExtraction({
        transcript,
        slideText,
        imageAnalysis
      });

      // Store raw extraction for regeneration
      sessionStorage.setItem('rawExtraction', JSON.stringify({
        transcript,
        slideText,
        imageAnalysis
      }));

      // Navigate to results page
      router.push('/results');
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setError(err.message || 'An error occurred during quiz generation');
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
    // CRITICAL FIX: Clear extraction errors on reset
    clearExtractionErrors();
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

    // CRITICAL FIX: Don't auto-proceed for custom type - let user enter prompt first
    if (type === 'custom') {
      // Just set the type, wait for user to enter prompt
      return;
    }

    // For quiz type, route to quiz generation instead of material generation
    if (type === 'quiz') {
      setCurrentStep(3);
      handleQuizGenerate();
      return;
    }

    setCurrentStep(3);
    // Start processing
    handleGenerate();
  };

  // CRITICAL FIX: Separate handler for custom prompt submission
  const handleCustomPromptSubmit = () => {
    if (!customPrompt.trim()) {
      setError('Please enter a custom prompt.');
      return;
    }

    setError('');
    setCurrentStep(3);
    handleGenerate();
  };

  const handleCreateAnother = (type: string) => {
    if (!cachedExtraction) return;

    setOutputType(type);

    // CRITICAL FIX: For custom type, show the custom prompt input
    if (type === 'custom') {
      setCurrentStep(2); // Go back to type selection to enter prompt
      setCustomPrompt(''); // Clear previous prompt
      return;
    }

    setCurrentStep(3);
    setIsProcessing(true);
    setError('');
    setResult('');

    // Show processing steps for cached data
    setProcessingSteps({
      transcription: { status: 'skipped', message: 'Using cached transcript' },
      slideExtraction: { status: 'skipped', message: 'Using cached slides' },
      imageAnalysis: { status: 'skipped', message: 'Using cached images' },
      materialGeneration: { status: 'loading', message: 'Generating new materials...' },
    });

    // Generate with cached extraction
    generateWithCachedData(type);
  };

  const generateWithCachedData = async (type: string, customPromptOverride?: string) => {
    try {
      const promptToUse = customPromptOverride || customPrompt;

      // CRITICAL FIX: Validate custom prompt
      if (type === 'custom' && !promptToUse.trim()) {
        setError('Custom prompt is required');
        setIsProcessing(false);
        setCurrentStep(2);
        return;
      }

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
          customPrompt: type === 'custom' ? promptToUse : undefined,
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

      // Store data and navigate to results
      sessionStorage.setItem('studyMaterialContent', generateData.content);
      sessionStorage.setItem('studyMaterialType', type);
      if (cachedExtraction?.transcript) {
        sessionStorage.setItem('studyMaterialTranscript', cachedExtraction.transcript);
      }

      router.push('/results');
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
    sessionStorage.clear();
    setProcessingSteps({
      transcription: { status: 'idle', message: '' },
      slideExtraction: { status: 'idle', message: '' },
      imageAnalysis: { status: 'idle', message: '' },
      materialGeneration: { status: 'idle', message: '' },
    });
  };

  return (
    <div className="min-h-screen bg-mesh-academic dark:bg-mesh-academic-dark texture-noise">
      {/* Header */}
      <header className="glass dark:glass-dark border-b border-border-light dark:border-border-dark sticky top-0 z-50 shadow-sm backdrop-blur-lg" role="banner">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-heading font-bold text-gradient-academic cursor-pointer hover:opacity-80 transition-opacity">
                LectureHelper AI
              </h1>
            </Link>
            <nav aria-label="Main navigation">
              <div className="flex gap-3">
                <Link
                  href="/materials"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2 font-semibold"
                  aria-label="Upload course materials (for instructors)"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">upload</span>
                  <span className="hidden md:inline">Instructors: Upload Materials</span>
                  <span className="md:hidden">Upload</span>
                </Link>
                <Link
                  href="/hub"
                  className="px-4 py-2 bg-accent hover:bg-accent-dark text-midnight-blue rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2 font-semibold"
                  aria-label="View your study hub"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">folder</span>
                  <span className="hidden md:inline">Study Hub</span>
                  <span className="md:hidden">Hub</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-8" role="main">
        <div className="max-w-5xl mx-auto">
          {/* Progress Indicator */}
          <StepIndicator
            currentStep={currentStep}
            steps={[
              {
                number: 1,
                label: 'Upload Materials',
                icon: 'cloud_upload',
                description: 'Add your lecture files'
              },
              {
                number: 2,
                label: 'Choose Type',
                icon: 'category',
                description: 'Select study material type'
              },
              {
                number: 3,
                label: 'Processing',
                icon: 'autorenew',
                description: 'AI generates content'
              },
              {
                number: 4,
                label: 'Results',
                icon: 'task_alt',
                description: 'Review and save'
              }
            ]}
            allowNavigation={false}
          />

          {/* Step 1: File Upload */}
          {currentStep === 1 && (
          <>
          <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-lg p-8 mb-8 card animate-slide-up">
            <h3 className="text-2xl font-heading font-bold text-oxford-blue dark:text-text-dark mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">cloud_upload</span>
              Add Your Lecture Materials
            </h3>

            <Tabs
              defaultTab="manual"
              tabs={[
                {
                  id: 'manual',
                  label: 'Upload Files',
                  icon: 'upload_file',
                  badge: 'Recommended',
                  content: (
                    <div className="space-y-6 animate-fade-in">
                      <p className="text-text-muted dark:text-text-dark-muted mb-4">
                        Upload your own lecture files for personalized study materials
                      </p>

                      {/* Audio/Video Upload */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-cerulean">videocam</span>
                          <h4 className="text-lg font-semibold text-oxford-blue dark:text-text-dark">Audio/Video Recording</h4>
                          <span className="badge badge-primary">
                            Recommended
                          </span>
                        </div>
                        <p className="text-sm text-text-muted dark:text-text-dark-muted mb-2">
                          Upload lecture recording for AI transcription and analysis
                        </p>
                        <FileUploader onFileSelect={setAudioFile} />
                      </div>

                      {/* Slides Upload */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-accent">description</span>
                          <h4 className="text-lg font-semibold text-oxford-blue dark:text-text-dark">Lecture Slides</h4>
                          <span className="px-2 py-0.5 bg-background text-text-muted text-xs rounded-full font-medium border border-border-light">
                            Optional
                          </span>
                        </div>
                        <p className="text-sm text-text-muted dark:text-text-dark-muted mb-2">
                          Add slides for better context and comprehensive materials
                        </p>
                        <SlideUploader onFilesSelect={setSlideFiles} />
                      </div>

                      {/* Photos Upload */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-success">image</span>
                          <h4 className="text-lg font-semibold text-oxford-blue dark:text-text-dark">Lecture Photos</h4>
                          <span className="px-2 py-0.5 bg-background text-text-muted text-xs rounded-full font-medium border border-border-light">
                            Optional
                          </span>
                        </div>
                        <p className="text-sm text-text-muted dark:text-text-dark-muted mb-2">
                          Include whiteboard photos or diagrams for visual learning
                        </p>
                        <ImageUploader onImagesSelect={setPhotoFiles} />
                      </div>
                    </div>
                  )
                },
                {
                  id: 'instructor',
                  label: 'Instructor Materials',
                  icon: 'school',
                  content: (
                    <div className="space-y-4 animate-fade-in">
                      <p className="text-text-muted dark:text-text-dark-muted mb-4">
                        Use materials already uploaded by your instructor for this course
                      </p>

                      <div className="bg-info/5 border border-info/20 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-oxford-blue dark:text-text-dark mb-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-info">info</span>
                          Benefits of Instructor Materials
                        </h4>
                        <ul className="text-sm text-text-muted dark:text-text-dark-muted space-y-1 ml-6 list-disc">
                          <li>Save time - materials are already organized</li>
                          <li>Access official course content</li>
                          <li>Consistent with class materials</li>
                        </ul>
                      </div>

                      {/* Instructor Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-oxford-blue dark:text-text-dark mb-2">
                          1. Select Instructor
                        </label>
                        <select
                          value={selectedInstructor}
                          onChange={(e) => {
                            setSelectedInstructor(e.target.value);
                            setSelectedWeek(null);
                            setSelectedLecture(null);
                            setUsePreUploaded(true);
                          }}
                          className="w-full px-4 py-3 border-2 border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background dark:bg-card-dark text-oxford-blue dark:text-text-dark"
                        >
                          <option value="">Choose an instructor...</option>
                          {instructors.map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Week Selection */}
                      {selectedInstructor && (
                        <div className="animate-slide-up">
                          <label className="block text-sm font-semibold text-oxford-blue dark:text-text-dark mb-2">
                            2. Select Week
                          </label>
                          <select
                            value={selectedWeek ?? ''}
                            onChange={(e) => {
                              setSelectedWeek(Number(e.target.value));
                              setSelectedLecture(null);
                            }}
                            className="w-full px-4 py-3 border-2 border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background dark:bg-card-dark text-oxford-blue dark:text-text-dark"
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
                        <div className="animate-slide-up">
                          <label className="block text-sm font-semibold text-oxford-blue dark:text-text-dark mb-2">
                            3. Select Lecture
                          </label>
                          <select
                            value={selectedLecture ?? ''}
                            onChange={(e) => setSelectedLecture(Number(e.target.value))}
                            className="w-full px-4 py-3 border-2 border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background dark:bg-card-dark text-oxford-blue dark:text-text-dark"
                          >
                            <option value="">Choose a lecture...</option>
                            {availableLectures.map((lecture) => (
                              <option key={lecture} value={lecture}>Lecture {lecture}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {selectedLecture !== null && (
                        <div className="bg-success/10 border border-success/30 rounded-lg p-4 mt-4 animate-success-pop">
                          <p className="text-success-dark dark:text-success flex items-center gap-2 font-semibold">
                            <span className="material-symbols-outlined">check_circle</span>
                            Materials loaded successfully!
                          </p>
                        </div>
                      )}
                    </div>
                  )
                }
              ]}
            />

          </div>

          {/* Continue Button */}
          <div className="mt-6">
            <button
              onClick={handleContinue}
              disabled={!audioFile && slideFiles.length === 0 && photoFiles.length === 0 && selectedLecture === null}
              className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              aria-label="Continue to material type selection"
              aria-disabled={!audioFile && slideFiles.length === 0 && photoFiles.length === 0 && selectedLecture === null}
            >
              <span>Continue to Select Material Type</span>
              <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            </button>
            {!audioFile && slideFiles.length === 0 && photoFiles.length === 0 && selectedLecture === null && (
              <p className="text-sm text-text-muted dark:text-text-dark-muted text-center mt-3" role="status" aria-live="polite">
                Please upload files or select instructor materials to continue
              </p>
            )}
          </div>
          </>
          )}

          {/* Step 2: Material Type Selection */}
          {currentStep === 2 && (
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-lg p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-text-dark mb-6 text-center">
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

              {/* Model Selection */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <ModelSelector
                  selectedTier={selectedModelTier}
                  onSelectTier={setSelectedModelTier}
                />
              </div>

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
                    onClick={handleCustomPromptSubmit}
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

          {/* Step 4: Results - Handled by /results page */}
        </div>
      </main>

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
