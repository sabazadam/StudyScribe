/**
 * API RESPONSE TYPE DEFINITIONS
 * ==============================================================================
 * Comprehensive TypeScript types for all API responses
 * Eliminates 'any' types and provides full type safety
 * ==============================================================================
 */

// ==============================================================================
// COMMON TYPES
// ==============================================================================

export interface ApiError {
  success: false;
  error: string;
  details?: string;
  statusCode?: number;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ==============================================================================
// MATERIAL GENERATION
// ==============================================================================

export interface MaterialSources {
  hasAudio: boolean;
  hasSlides: boolean;
  hasImages: boolean;
  audioLength?: number;
  slideCount?: number;
  imageCount?: number;
}

export interface MaterialImageData {
  visualMarkers: VisualMarker[];
  proposals: ImageProposal[];
  finalImages: ImageGenerationResponse[];
  totalCost: number;
  generatedCount: number;
}

export interface VisualMarker {
  id: string;
  description: string;
  rawMarker: string;
  position: number;
}

export interface ImageProposal {
  id: string;
  markerId: string;
  originalDescription: string;
  enhancedPrompt: string;
  imageType: string;
  educationalPurpose: string;
  simplicity: number;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageData?: string;  // base64 encoded
  mimeType?: string;
  width?: number;
  height?: number;
  generatedAt: string;
  error?: string;
  cost?: number;
}

export interface GenerateMaterialsRequest {
  transcript: string;
  slideText: string;
  imageAnalysis: string;
  materialType: string;
  modelTier: string;
  customPrompt?: string;
  maxImages?: string;  // "0", "1", or "2"
}

export interface GenerateMaterialsResponse {
  success: boolean;
  content: string;
  materialType: string;
  timestamp: string;
  sources: MaterialSources;
  imageData?: MaterialImageData;
  hasImages: boolean;
  error?: string;
}

// ==============================================================================
// QUIZ GENERATION
// ==============================================================================

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface GeneratedQuiz {
  questions: QuizQuestion[];
  title: string;
  topic: string;
}

export interface GenerateQuizResponse {
  success: boolean;
  quiz: GeneratedQuiz;
  timestamp: string;
  error?: string;
}

// ==============================================================================
// FILE EXTRACTION
// ==============================================================================

export interface ExtractSlidesRequest {
  file: File;
}

export interface ExtractSlidesResponse {
  success: boolean;
  text?: string;
  error?: string;
  fileName?: string;
  pageCount?: number;
}

export interface AnalyzeImageRequest {
  images: string[];  // base64 encoded images
}

export interface AnalyzeImageResponse {
  success: boolean;
  analysis?: string;
  error?: string;
  imageCount?: number;
}

// ==============================================================================
// AUDIO TRANSCRIPTION
// ==============================================================================

export interface TranscribeAudioRequest {
  audioBase64: string;
  fileName: string;
}

export interface TranscribeAudioResponse {
  success: boolean;
  transcript?: string;
  error?: string;
  duration?: number;
  language?: string;
}

// ==============================================================================
// IMAGE GENERATION
// ==============================================================================

export interface ImageGenerationRequest {
  prompt: string;
  educationalContext?: string;
  imageType?: string;
  aspectRatio?: string;
  numberOfImages?: number;
}

export interface GenerateImageRequest {
  request: ImageGenerationRequest;
  materialId?: string;
  proposalId?: string;
}

export interface GenerateImageResponseBody {
  success: boolean;
  image?: ImageGenerationResponse;
  cost?: number;
  remainingQuota?: {
    imagesRemaining: number;
    budgetRemaining?: number;
  };
  error?: string;
}

// ==============================================================================
// PRE-UPLOADED MATERIALS
// ==============================================================================

export interface MaterialFile {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: 'audio' | 'video' | 'slide' | 'photo';
  size: number;
  uploadedAt: string;
}

export interface LectureMaterial {
  id: string;
  courseCode: string;
  lectureName: string;
  uploadedBy: string;
  uploadedAt: string;
  files: MaterialFile[];
}

export interface FetchMaterialsResponse {
  success: boolean;
  materials?: LectureMaterial[];
  error?: string;
  count?: number;
}

// ==============================================================================
// TYPE GUARDS
// ==============================================================================

export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response
  );
}

export function isGenerateMaterialsResponse(
  response: unknown
): response is GenerateMaterialsResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'content' in response &&
    'materialType' in response
  );
}

export function isGenerateQuizResponse(
  response: unknown
): response is GenerateQuizResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'quiz' in response
  );
}

// ==============================================================================
// UTILITY TYPES
// ==============================================================================

export type MaterialType = 'summary' | 'exam' | 'quiz' | 'mock-exam' | 'explain';
export type ModelTier = 'default' | 'advanced';
export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

export interface ProcessingStep {
  status: ProcessingStatus;
  message: string;
  progress?: number;
}

export interface ProcessingSteps {
  transcription: ProcessingStep;
  slideExtraction: ProcessingStep;
  imageAnalysis: ProcessingStep;
  generation: ProcessingStep;
}
