/**
 * INPUT VALIDATION SCHEMAS
 * ==============================================================================
 * Zod schemas for validating user inputs across the application
 * Prevents XSS, injection attacks, malformed data, and resource exhaustion
 * ==============================================================================
 */

import { z } from 'zod';

// ==============================================================================
// SECURITY CONSTANTS
// ==============================================================================

// String length limits (prevent resource exhaustion)
export const LIMITS = {
  // Text content limits
  TRANSCRIPT_MAX: 50000,        // ~12,500 words
  SLIDE_TEXT_MAX: 30000,        // ~7,500 words
  IMAGE_ANALYSIS_MAX: 20000,    // ~5,000 words
  CUSTOM_PROMPT_MAX: 2000,      // ~500 words
  CHAT_MESSAGE_MAX: 5000,       // ~1,250 words
  TITLE_MAX: 200,               // Reasonable title length
  DESCRIPTION_MAX: 1000,        // Reasonable description
  TAG_MAX: 50,                  // Single tag length

  // Array size limits
  MAX_TAGS: 20,
  MAX_QUESTIONS: 50,
  MAX_OPTIONS_PER_QUESTION: 10,
  MAX_CONVERSATION_HISTORY: 50, // Prevent memory exhaustion
  MAX_FILES: 20,

  // File size limits (bytes)
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_TOTAL_FILES_SIZE: 200 * 1024 * 1024, // 200MB total

  // Nested object depth limits
  MAX_OBJECT_DEPTH: 10,
} as const;

// ==============================================================================
// MATERIAL GENERATION VALIDATION
// ==============================================================================

export const generateMaterialsSchema = z.object({
  transcript: z.string()
    .max(LIMITS.TRANSCRIPT_MAX, `Transcript too long (max ${LIMITS.TRANSCRIPT_MAX.toLocaleString()} characters)`)
    .optional()
    .transform(val => val || ''),
  slideText: z.string()
    .max(LIMITS.SLIDE_TEXT_MAX, `Slide text too long (max ${LIMITS.SLIDE_TEXT_MAX.toLocaleString()} characters)`)
    .optional()
    .transform(val => val || ''),
  imageAnalysis: z.string()
    .max(LIMITS.IMAGE_ANALYSIS_MAX, `Image analysis too long (max ${LIMITS.IMAGE_ANALYSIS_MAX.toLocaleString()} characters)`)
    .optional()
    .transform(val => val || ''),
  materialType: z.enum(['summary', 'exam', 'quiz', 'mock-exam', 'explain', 'custom']),
  modelTier: z.enum(['default', 'better', 'star']).optional(),
  customPrompt: z.string()
    .max(LIMITS.CUSTOM_PROMPT_MAX, `Custom prompt too long (max ${LIMITS.CUSTOM_PROMPT_MAX.toLocaleString()} characters)`)
    .optional(),
  maxImages: z.union([
    z.enum(['0', '1', '2']),
    z.number().int().min(0).max(2)
  ]).optional()
    .transform(val => {
      if (val === undefined) return 0;
      return typeof val === 'string' ? parseInt(val) : val;
    }),
  extractionErrors: z.any().optional(), // Allow any structure for error reporting
}).refine(
  (data) => {
    // At least one content source must be provided
    const hasContent = (data.transcript && data.transcript.trim().length > 0) ||
                      (data.slideText && data.slideText.trim().length > 0) ||
                      (data.imageAnalysis && data.imageAnalysis.trim().length > 0);
    return hasContent;
  },
  {
    message: 'At least one content source (transcript, slideText, or imageAnalysis) must be provided',
  }
).refine(
  (data) => {
    // Custom material type requires customPrompt
    if (data.materialType === 'custom') {
      return data.customPrompt && data.customPrompt.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Custom prompt is required when materialType is "custom"',
  }
);

export type GenerateMaterialsInput = z.infer<typeof generateMaterialsSchema>;

// ==============================================================================
// FILE UPLOAD VALIDATION
// ==============================================================================

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'video/quicktime'];
const ALLOWED_SLIDE_TYPES = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const fileUploadSchema = z.object({
  file: z.custom<File>((file) => file instanceof File, 'Must be a file'),
  fileType: z.enum(['audio', 'slide', 'image']),
}).refine(
  (data) => {
    const { file, fileType } = data;
    if (file.size > MAX_FILE_SIZE) return false;

    const allowedTypes = {
      audio: ALLOWED_AUDIO_TYPES,
      slide: ALLOWED_SLIDE_TYPES,
      image: ALLOWED_IMAGE_TYPES,
    };

    return allowedTypes[fileType].includes(file.type);
  },
  {
    message: 'Invalid file type or size exceeds 50MB',
  }
);

// ==============================================================================
// USER AUTHENTICATION VALIDATION
// ==============================================================================

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ==============================================================================
// QUIZ VALIDATION
// ==============================================================================

export const quizQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string()
    .min(5, 'Question too short (min 5 characters)')
    .max(1000, 'Question too long (max 1,000 characters)'),
  options: z.array(
    z.string()
      .min(1, 'Option cannot be empty')
      .max(500, 'Option too long (max 500 characters)')
  )
    .min(2, 'At least 2 options required')
    .max(LIMITS.MAX_OPTIONS_PER_QUESTION, `Too many options (max ${LIMITS.MAX_OPTIONS_PER_QUESTION})`),
  correctAnswer: z.number().int().min(0),
  explanation: z.string()
    .min(10, 'Explanation too short (min 10 characters)')
    .max(2000, 'Explanation too long (max 2,000 characters)'),
  points: z.number().int().min(0).max(100).optional().default(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
}).refine(
  (data) => data.correctAnswer < data.options.length,
  {
    message: 'correctAnswer index must be less than options array length',
  }
);

export const createQuizSchema = z.object({
  title: z.string()
    .min(3, 'Title too short (min 3 characters)')
    .max(LIMITS.TITLE_MAX, `Title too long (max ${LIMITS.TITLE_MAX} characters)`),
  description: z.string()
    .max(LIMITS.DESCRIPTION_MAX, `Description too long (max ${LIMITS.DESCRIPTION_MAX} characters)`)
    .optional(),
  questions: z.array(quizQuestionSchema)
    .min(1, 'At least one question required')
    .max(LIMITS.MAX_QUESTIONS, `Too many questions (max ${LIMITS.MAX_QUESTIONS})`),
  timeLimit: z.number().int().min(0).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  sources: z.object({
    transcript: z.string().optional(),
    slideText: z.string().optional(),
    imageAnalysis: z.string().optional(),
  }).optional(),
});

export const generateQuizSchema = z.object({
  content: z.string()
    .min(50, 'Content too short for quiz generation (min 50 characters)')
    .max(LIMITS.TRANSCRIPT_MAX, `Content too long (max ${LIMITS.TRANSCRIPT_MAX.toLocaleString()} characters)`),
  title: z.string()
    .min(3, 'Title too short (min 3 characters)')
    .max(LIMITS.TITLE_MAX, `Title too long (max ${LIMITS.TITLE_MAX} characters)`),
  questionCount: z.number()
    .int()
    .min(1, 'At least 1 question required')
    .max(LIMITS.MAX_QUESTIONS, `Too many questions (max ${LIMITS.MAX_QUESTIONS})`)
    .optional()
    .default(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  modelTier: z.enum(['default', 'better', 'star']).optional().default('better'),
  timeLimit: z.number().int().min(0).optional(),
  materialId: z.string().optional(),
});

// ==============================================================================
// CHAT VALIDATION
// ==============================================================================

export const chatMessageSchema = z.object({
  question: z.string()
    .min(1, 'Question cannot be empty')
    .max(LIMITS.CHAT_MESSAGE_MAX, `Question too long (max ${LIMITS.CHAT_MESSAGE_MAX.toLocaleString()} characters)`),
  transcript: z.string()
    .max(LIMITS.TRANSCRIPT_MAX, `Transcript too long (max ${LIMITS.TRANSCRIPT_MAX.toLocaleString()} characters)`)
    .optional(),
  studyMaterials: z.string()
    .max(LIMITS.TRANSCRIPT_MAX, `Study materials too long (max ${LIMITS.TRANSCRIPT_MAX.toLocaleString()} characters)`)
    .optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(LIMITS.CHAT_MESSAGE_MAX),
    })
  )
    .max(LIMITS.MAX_CONVERSATION_HISTORY, `Too many messages in history (max ${LIMITS.MAX_CONVERSATION_HISTORY})`)
    .optional(),
  modelTier: z.enum(['default', 'better', 'star']).optional(),
}).refine(
  (data) => {
    // At least one context source required
    return data.transcript || data.studyMaterials;
  },
  {
    message: 'Either transcript or studyMaterials must be provided as context',
  }
);

// ==============================================================================
// IMAGE GENERATION VALIDATION
// ==============================================================================

export const generateImageSchema = z.object({
  request: z.object({
    prompt: z.string()
      .min(10, 'Prompt too short (min 10 characters)')
      .max(1000, 'Prompt too long (max 1,000 characters)'),
    educationalContext: z.string()
      .max(500, 'Educational context too long (max 500 characters)')
      .optional(),
    imageType: z.string()
      .max(50, 'Image type too long (max 50 characters)')
      .optional(),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional().default('4:3'),
    numberOfImages: z.number().int().min(1).max(1).optional().default(1), // Enforce single image
    negativePrompt: z.string().max(500).optional(),
  }),
  materialId: z.string().optional(),
  proposalId: z.string().optional(),
});

// ==============================================================================
// STUDY MATERIALS VALIDATION
// ==============================================================================

export const createMaterialSchema = z.object({
  title: z.string()
    .min(3, 'Title too short (min 3 characters)')
    .max(LIMITS.TITLE_MAX, `Title too long (max ${LIMITS.TITLE_MAX} characters)`),
  materialType: z.enum(['summary', 'exam', 'quiz', 'mock-exam', 'explain', 'custom']),
  content: z.string()
    .min(10, 'Content too short (min 10 characters)')
    .max(200000, 'Content too long (max 200,000 characters)'), // Allow large generated content
  sources: z.object({
    transcript: z.string().optional(),
    slideText: z.string().optional(),
    imageAnalysis: z.string().optional(),
  }).optional(),
  imageData: z.any().optional(), // Complex nested structure
  tags: z.array(
    z.string().max(LIMITS.TAG_MAX, `Tag too long (max ${LIMITS.TAG_MAX} characters)`)
  )
    .max(LIMITS.MAX_TAGS, `Too many tags (max ${LIMITS.MAX_TAGS})`)
    .optional(),
  folderId: z.string().nullable().optional(),
});

export const updateMaterialSchema = z.object({
  id: z.string().min(1, 'Material ID required'),
  title: z.string()
    .min(3, 'Title too short')
    .max(LIMITS.TITLE_MAX, `Title too long (max ${LIMITS.TITLE_MAX})`)
    .optional(),
  content: z.string()
    .min(10, 'Content too short')
    .max(200000, 'Content too long')
    .optional(),
  tags: z.array(z.string().max(LIMITS.TAG_MAX))
    .max(LIMITS.MAX_TAGS)
    .optional(),
  imageData: z.any().optional(),
}).refine(
  (data) => {
    // At least one field to update
    return data.title || data.content || data.tags || data.imageData;
  },
  {
    message: 'At least one field must be provided to update',
  }
);

// ==============================================================================
// FILE UPLOAD VALIDATION (Enhanced)
// ==============================================================================

export const transcribeFileSchema = z.object({
  file: z.custom<File>((file) => {
    if (!(file instanceof File)) return false;
    if (file.size > LIMITS.MAX_FILE_SIZE) return false;

    const allowedTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/webm',
      'audio/ogg',
      'video/mp4',
      'video/quicktime',
      'video/webm',
    ];

    return allowedTypes.includes(file.type);
  }, {
    message: `Invalid audio/video file. Must be under ${LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB and be a supported format (MP3, WAV, MP4, WebM, OGG, MOV)`,
  }),
});

export const extractSlidesFilesSchema = z.object({
  files: z.array(
    z.custom<File>((file) => {
      if (!(file instanceof File)) return false;
      if (file.size > LIMITS.MAX_FILE_SIZE) return false;

      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];

      return allowedTypes.includes(file.type);
    }, {
      message: `Invalid file. Each file must be under ${LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB and be PDF, PPTX, or image format`,
    })
  )
    .min(1, 'At least one file required')
    .max(LIMITS.MAX_FILES, `Too many files (max ${LIMITS.MAX_FILES})`),
}).refine(
  (data) => {
    const totalSize = data.files.reduce((sum, file) => sum + file.size, 0);
    return totalSize <= LIMITS.MAX_TOTAL_FILES_SIZE;
  },
  {
    message: `Total file size exceeds ${LIMITS.MAX_TOTAL_FILES_SIZE / 1024 / 1024}MB limit`,
  }
);

// ==============================================================================
// SANITIZATION HELPERS
// ==============================================================================

/**
 * Sanitize user input to prevent XSS attacks
 * Removes HTML tags and dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove objects
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embeds
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:text\/html/gi, '') // Remove data URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/\0/g, '') // Remove null bytes
    .trim();
}

/**
 * Sanitize HTML but allow safe markdown-compatible tags
 * Used for content that will be rendered as markdown
 */
export function sanitizeMarkdownContent(input: string): string {
  if (!input) return '';

  // Remove dangerous tags but allow basic formatting
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/\0/g, '')
    .trim();
}

/**
 * Validate and sanitize custom prompt
 */
export function validateCustomPrompt(prompt: string | undefined): string {
  if (!prompt) return '';

  const sanitized = sanitizeInput(prompt);

  if (sanitized.length > LIMITS.CUSTOM_PROMPT_MAX) {
    throw new Error(`Custom prompt too long (max ${LIMITS.CUSTOM_PROMPT_MAX.toLocaleString()} characters)`);
  }

  return sanitized;
}

/**
 * Validate object depth to prevent prototype pollution and stack overflow
 */
export function validateObjectDepth(obj: any, maxDepth: number = LIMITS.MAX_OBJECT_DEPTH): boolean {
  function checkDepth(current: any, depth: number): boolean {
    if (depth > maxDepth) return false;

    if (typeof current !== 'object' || current === null) return true;

    if (Array.isArray(current)) {
      return current.every(item => checkDepth(item, depth + 1));
    }

    return Object.values(current).every(value => checkDepth(value, depth + 1));
  }

  return checkDepth(obj, 0);
}

/**
 * Sanitize array of strings (for tags, options, etc.)
 */
export function sanitizeStringArray(arr: string[], maxLength: number = LIMITS.TAG_MAX): string[] {
  if (!Array.isArray(arr)) return [];

  return arr
    .filter(item => typeof item === 'string')
    .map(item => sanitizeInput(item))
    .filter(item => item.length > 0 && item.length <= maxLength)
    .slice(0, LIMITS.MAX_TAGS); // Enforce max array size
}

// ==============================================================================
// API ROUTE VALIDATION HELPER
// ==============================================================================

/**
 * Validate request body against a Zod schema
 * Returns parsed data or throws validation error
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  // First check object depth
  if (typeof data === 'object' && data !== null) {
    if (!validateObjectDepth(data)) {
      throw new Error(`Request data exceeds maximum nesting depth of ${LIMITS.MAX_OBJECT_DEPTH}`);
    }
  }

  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`);
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return result.data;
}

/**
 * Validate request body and return result with detailed error info
 */
export function validateRequestSafe<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
} {
  try {
    // Check object depth
    if (typeof data === 'object' && data !== null) {
      if (!validateObjectDepth(data)) {
        return {
          success: false,
          error: `Request data exceeds maximum nesting depth of ${LIMITS.MAX_OBJECT_DEPTH}`,
          errors: ['Object nesting too deep - potential security risk'],
        };
      }
    }

    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`);
      return {
        success: false,
        error: `Validation failed: ${errors.join(', ')}`,
        errors,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Validation error',
      errors: [error.message],
    };
  }
}
