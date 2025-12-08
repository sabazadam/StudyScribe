/**
 * API Error Handling Utilities
 * ==============================================================================
 * Centralized error handling for consistent API responses
 * ==============================================================================
 */

import { NextResponse } from 'next/server';
import {
  ErrorCode,
  ErrorResponse,
  ErrorMetadata,
  QuotaErrorDetails,
  ValidationErrorDetails
} from '@/lib/types/api';
import { randomUUID } from 'crypto';

// Re-export ErrorCode for convenience
export { ErrorCode } from '@/lib/types/api';

// ============================================================================
// Error Code to HTTP Status Code Mapping
// ============================================================================

const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  // Authentication & Authorization
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,

  // Validation Errors
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.INVALID_FILE_TYPE]: 400,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.INVALID_PARAMETER]: 400,

  // Resource Errors
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.CONFLICT]: 409,

  // Rate Limiting & Quotas
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.QUOTA_EXCEEDED]: 429,
  [ErrorCode.DAILY_LIMIT_REACHED]: 429,
  [ErrorCode.BUDGET_EXCEEDED]: 429,

  // Processing Errors
  [ErrorCode.PROCESSING_FAILED]: 422,
  [ErrorCode.AI_GENERATION_FAILED]: 422,
  [ErrorCode.TRANSCRIPTION_FAILED]: 422,
  [ErrorCode.IMAGE_GENERATION_FAILED]: 422,
  [ErrorCode.PDF_PROCESSING_FAILED]: 422,
  [ErrorCode.AUDIO_CONVERSION_FAILED]: 422,
  [ErrorCode.NO_CONTENT_EXTRACTED]: 422,
  [ErrorCode.INVALID_AI_RESPONSE]: 422,

  // External Service Errors
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.TIMEOUT]: 504,
  [ErrorCode.GATEWAY_ERROR]: 502,

  // Database Errors
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.SAVE_FAILED]: 500,
  [ErrorCode.UPDATE_FAILED]: 500,
  [ErrorCode.DELETE_FAILED]: 500,
  [ErrorCode.QUERY_FAILED]: 500,

  // Configuration Errors
  [ErrorCode.CONFIGURATION_ERROR]: 500,
  [ErrorCode.MISSING_API_KEY]: 500,
  [ErrorCode.INVALID_CONFIGURATION]: 500,

  // Generic Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.UNKNOWN_ERROR]: 500,
};

// ============================================================================
// User-Friendly Error Messages
// ============================================================================

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication & Authorization
  [ErrorCode.UNAUTHORIZED]: 'You must be signed in to access this resource.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource.',
  [ErrorCode.INVALID_TOKEN]: 'Your authentication token is invalid. Please sign in again.',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have the required permissions for this action.',

  // Validation Errors
  [ErrorCode.VALIDATION_ERROR]: 'The provided data is invalid.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required fields are missing.',
  [ErrorCode.INVALID_INPUT]: 'The input provided is invalid.',
  [ErrorCode.INVALID_FORMAT]: 'The data format is incorrect.',
  [ErrorCode.INVALID_FILE_TYPE]: 'This file type is not supported.',
  [ErrorCode.FILE_TOO_LARGE]: 'The file is too large to process.',
  [ErrorCode.INVALID_PARAMETER]: 'One or more parameters are invalid.',

  // Resource Errors
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'The resource you are looking for does not exist.',
  [ErrorCode.ALREADY_EXISTS]: 'This resource already exists.',
  [ErrorCode.CONFLICT]: 'There is a conflict with the current state of the resource.',

  // Rate Limiting & Quotas
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'You have made too many requests. Please try again later.',
  [ErrorCode.QUOTA_EXCEEDED]: 'You have exceeded your usage quota.',
  [ErrorCode.DAILY_LIMIT_REACHED]: 'You have reached your daily limit.',
  [ErrorCode.BUDGET_EXCEEDED]: 'You have exceeded your budget limit.',

  // Processing Errors
  [ErrorCode.PROCESSING_FAILED]: 'Failed to process your request.',
  [ErrorCode.AI_GENERATION_FAILED]: 'AI generation failed. Please try again.',
  [ErrorCode.TRANSCRIPTION_FAILED]: 'Audio transcription failed. Please check your file and try again.',
  [ErrorCode.IMAGE_GENERATION_FAILED]: 'Image generation failed. Please try again.',
  [ErrorCode.PDF_PROCESSING_FAILED]: 'Failed to process PDF file. Please ensure it contains text or images.',
  [ErrorCode.AUDIO_CONVERSION_FAILED]: 'Failed to convert audio file. Please check the file format.',
  [ErrorCode.NO_CONTENT_EXTRACTED]: 'No content could be extracted from your files.',
  [ErrorCode.INVALID_AI_RESPONSE]: 'Received an invalid response from AI. Please try again.',

  // External Service Errors
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'An external service encountered an error. Please try again later.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable. Please try again later.',
  [ErrorCode.TIMEOUT]: 'The request timed out. Please try again.',
  [ErrorCode.GATEWAY_ERROR]: 'Gateway error occurred. Please try again later.',

  // Database Errors
  [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again.',
  [ErrorCode.SAVE_FAILED]: 'Failed to save data. Please try again.',
  [ErrorCode.UPDATE_FAILED]: 'Failed to update the resource. Please try again.',
  [ErrorCode.DELETE_FAILED]: 'Failed to delete the resource. Please try again.',
  [ErrorCode.QUERY_FAILED]: 'Failed to retrieve data. Please try again.',

  // Configuration Errors
  [ErrorCode.CONFIGURATION_ERROR]: 'Server configuration error. Please contact support.',
  [ErrorCode.MISSING_API_KEY]: 'API key is not configured. Please contact support.',
  [ErrorCode.INVALID_CONFIGURATION]: 'Invalid server configuration. Please contact support.',

  // Generic Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An internal server error occurred. Please try again later.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

// ============================================================================
// Error Handler Class
// ============================================================================

/**
 * API Error class with structured error information
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly details?: string;
  public readonly field?: string;
  public readonly suggestions?: string[];
  public readonly metadata?: Record<string, unknown>;
  public readonly requestId: string;

  constructor(
    code: ErrorCode,
    options?: {
      message?: string;           // Override default user message
      details?: string;           // Technical details
      field?: string;             // Field that caused the error
      suggestions?: string[];     // Helpful suggestions
      metadata?: Record<string, unknown>; // Additional metadata
    }
  ) {
    const userMessage = options?.message || ERROR_MESSAGES[code];
    super(userMessage);

    this.name = 'ApiError';
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code] || 500;
    this.userMessage = userMessage;
    this.details = options?.details;
    this.field = options?.field;
    this.suggestions = options?.suggestions;
    this.metadata = options?.metadata;
    this.requestId = randomUUID();

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to ErrorResponse format
   */
  toResponse(): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.userMessage,
        details: this.details,
        field: this.field,
        suggestions: this.suggestions,
      },
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
    };
  }

  /**
   * Convert error to NextResponse
   */
  toNextResponse(): NextResponse<ErrorResponse> {
    return NextResponse.json(this.toResponse(), { status: this.statusCode });
  }
}

// ============================================================================
// Error Response Builders
// ============================================================================

/**
 * Create a standard error response
 */
export function createErrorResponse(
  code: ErrorCode,
  options?: {
    message?: string;
    details?: string;
    field?: string;
    suggestions?: string[];
    statusCode?: number;
  }
): NextResponse<ErrorResponse> {
  const error = new ApiError(code, options);
  return error.toNextResponse();
}

/**
 * Create a validation error response
 */
export function createValidationError(
  field: string,
  message: string,
  details?: string
): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorCode.VALIDATION_ERROR, {
    message: `Validation failed for field '${field}': ${message}`,
    field,
    details,
  });
}

/**
 * Create an authentication error response
 */
export function createAuthError(
  message: string = 'Unauthorized. Please sign in to continue.'
): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorCode.UNAUTHORIZED, { message });
}

/**
 * Create a forbidden error response
 */
export function createForbiddenError(
  message: string = 'You do not have permission to perform this action.'
): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorCode.FORBIDDEN, { message });
}

/**
 * Create a not found error response
 */
export function createNotFoundError(
  resource: string = 'Resource'
): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorCode.NOT_FOUND, {
    message: `${resource} not found.`,
  });
}

/**
 * Create a quota exceeded error response
 */
export function createQuotaError(
  quotaDetails: QuotaErrorDetails
): NextResponse<ErrorResponse> {
  const message = `You have reached your ${quotaDetails.quotaType} limit (${quotaDetails.current}/${quotaDetails.limit}).`;

  const suggestions = [
    quotaDetails.resetAt
      ? `Your quota will reset at ${new Date(quotaDetails.resetAt).toLocaleString()}.`
      : 'Your quota will reset daily.',
    'Upgrade to a premium plan for higher limits.',
  ];

  return createErrorResponse(ErrorCode.QUOTA_EXCEEDED, {
    message,
    details: JSON.stringify(quotaDetails),
    suggestions,
  });
}

/**
 * Create a processing error response
 */
export function createProcessingError(
  process: string,
  details?: string,
  suggestions?: string[]
): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorCode.PROCESSING_FAILED, {
    message: `Failed to process ${process}.`,
    details,
    suggestions: suggestions || ['Please try again later.', 'If the problem persists, contact support.'],
  });
}

/**
 * Create a missing required field error
 */
export function createMissingFieldError(
  fields: string[]
): NextResponse<ErrorResponse> {
  return createErrorResponse(ErrorCode.MISSING_REQUIRED_FIELD, {
    message: `Missing required fields: ${fields.join(', ')}`,
    details: `The following fields are required: ${fields.join(', ')}`,
    suggestions: [`Please provide all required fields: ${fields.join(', ')}`],
  });
}

/**
 * Create an internal server error response
 * IMPORTANT: Never expose stack traces or sensitive info
 */
export function createInternalError(
  error: Error | unknown,
  requestContext?: string
): NextResponse<ErrorResponse> {
  // Log the full error server-side
  console.error('[API Error]', {
    context: requestContext,
    error,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Return sanitized error to client
  return createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR, {
    details: process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : String(error))
      : undefined,
    suggestions: [
      'Please try again later.',
      'If the problem persists, contact support.',
    ],
  });
}

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ApiError): boolean {
  const retryableCodes = [
    ErrorCode.TIMEOUT,
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.GATEWAY_ERROR,
    ErrorCode.EXTERNAL_SERVICE_ERROR,
  ];
  return retryableCodes.includes(error.code);
}

// ============================================================================
// HTTP Status Code Utilities
// ============================================================================

/**
 * Get HTTP status code for error code
 */
export function getStatusCode(code: ErrorCode): number {
  return ERROR_STATUS_MAP[code] || 500;
}

/**
 * Get user-friendly message for error code
 */
export function getUserMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];
}
