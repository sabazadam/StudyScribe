/**
 * Standard API Response Types
 * ==============================================================================
 * Consistent types for all API responses across the application
 * ==============================================================================
 */

/**
 * Standard error response format
 * All API routes should return this format for errors
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;           // Machine-readable error code
    message: string;            // User-friendly message
    details?: string;           // Technical details for debugging
    field?: string;             // Which field caused the error (for validation)
    suggestions?: string[];     // Helpful suggestions for resolving the error
  };
  timestamp: string;           // ISO 8601 timestamp
  requestId?: string;          // Request tracking ID for debugging
}

/**
 * Standard success response format
 * Generic type allows flexibility for different response data
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;                    // Response payload
  message?: string;            // Optional success message
  timestamp?: string;          // ISO 8601 timestamp
  metadata?: Record<string, unknown>; // Optional metadata
}

/**
 * Combined API response type
 */
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Standard error codes
 * Use these consistently across all API routes
 */
export enum ErrorCode {
  // ============================================================================
  // Authentication & Authorization (401, 403)
  // ============================================================================
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // ============================================================================
  // Validation Errors (400)
  // ============================================================================
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_PARAMETER = 'INVALID_PARAMETER',

  // ============================================================================
  // Resource Errors (404, 409)
  // ============================================================================
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // ============================================================================
  // Rate Limiting & Quotas (429)
  // ============================================================================
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  DAILY_LIMIT_REACHED = 'DAILY_LIMIT_REACHED',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',

  // ============================================================================
  // Processing Errors (422, 500)
  // ============================================================================
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  TRANSCRIPTION_FAILED = 'TRANSCRIPTION_FAILED',
  IMAGE_GENERATION_FAILED = 'IMAGE_GENERATION_FAILED',
  PDF_PROCESSING_FAILED = 'PDF_PROCESSING_FAILED',
  AUDIO_CONVERSION_FAILED = 'AUDIO_CONVERSION_FAILED',
  NO_CONTENT_EXTRACTED = 'NO_CONTENT_EXTRACTED',
  INVALID_AI_RESPONSE = 'INVALID_AI_RESPONSE',

  // ============================================================================
  // External Service Errors (502, 503, 504)
  // ============================================================================
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  GATEWAY_ERROR = 'GATEWAY_ERROR',

  // ============================================================================
  // Database Errors (500)
  // ============================================================================
  DATABASE_ERROR = 'DATABASE_ERROR',
  SAVE_FAILED = 'SAVE_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  QUERY_FAILED = 'QUERY_FAILED',

  // ============================================================================
  // Configuration Errors (500)
  // ============================================================================
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  MISSING_API_KEY = 'MISSING_API_KEY',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',

  // ============================================================================
  // Generic Errors (500)
  // ============================================================================
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error metadata for additional context
 */
export interface ErrorMetadata {
  code: ErrorCode;
  statusCode: number;
  message: string;
  userMessage?: string;       // Friendly message for end users
  technicalMessage?: string;  // Technical details for developers
  suggestions?: string[];     // How to fix the error
  retryable?: boolean;        // Whether the request can be retried
}

/**
 * Quota error details
 */
export interface QuotaErrorDetails {
  quotaType: 'materials' | 'images' | 'quizzes' | 'budget';
  current: number;
  limit: number;
  resetAt?: string;           // When the quota resets (ISO 8601)
}

/**
 * Validation error details
 */
export interface ValidationErrorDetails {
  field: string;
  value?: unknown;
  constraint: string;
  expected?: string;
}

// ==============================================================================
// LEGACY API TYPES (from /types/api.ts)
// ==============================================================================
// These types are still in use throughout the codebase
// TODO: Migrate to new standardized response format

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

export type ApiResponseLegacy<T = unknown> = ApiSuccess<T> | ApiError;

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
