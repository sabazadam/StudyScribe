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
