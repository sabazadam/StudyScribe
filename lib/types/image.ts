/**
 * Type definitions for AI-generated educational images using Google Imagen 3
 *
 * This file defines the data structures for:
 * - Image generation requests and responses
 * - Visual marker parsing from content
 * - Image proposal and approval workflow
 * - Cost tracking and usage limits
 */

// ============================================================================
// Visual Marker Types
// ============================================================================

/**
 * Represents a visual marker extracted from generated content
 * Format: {{IMAGE:detailed description}}
 */
export interface VisualMarker {
  /** The full marker text including {{IMAGE:...}} */
  rawMarker: string;

  /** The description extracted from the marker */
  description: string;

  /** Zero-based index where the marker appears in the content */
  position: number;

  /** Unique ID for tracking this marker */
  id: string;
}

/**
 * Result of parsing content for visual markers
 */
export interface ParsedVisualContent {
  /** Array of visual markers found in the content */
  markers: VisualMarker[];

  /** Content with markers removed (clean markdown) */
  cleanContent: string;

  /** Content with markers replaced by placeholder references */
  contentWithPlaceholders: string;

  /** Total number of markers found */
  markerCount: number;
}

// ============================================================================
// Image Generation Types
// ============================================================================

/**
 * Type of diagram/image to generate
 */
export type ImageType =
  | 'flowchart'
  | 'diagram'
  | 'comparison'
  | 'hierarchy'
  | 'cycle'
  | 'concept-map'
  | 'system'
  | 'process'
  | 'timeline'
  | 'relationship'
  | 'other';

/**
 * Request to generate a single image using Imagen 3
 */
export interface ImageGenerationRequest {
  /** Detailed description of the image to generate */
  prompt: string;

  /** Educational context to improve relevance */
  educationalContext?: string;

  /** Type of diagram/visualization */
  imageType?: ImageType;

  /** Aspect ratio for the image */
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

  /** Negative prompt to avoid unwanted elements */
  negativePrompt?: string;

  /** Number of images to generate (default: 1) */
  numberOfImages?: number;
}

/**
 * Response from Imagen 3 image generation
 */
export interface ImageGenerationResponse {
  /** Whether generation was successful */
  success: boolean;

  /** Base64-encoded image data (if successful) */
  imageData?: string;

  /** Public URL to the image (if uploaded) */
  imageUrl?: string;

  /** MIME type of the generated image */
  mimeType?: string;

  /** Width of the generated image */
  width?: number;

  /** Height of the generated image */
  height?: number;

  /** Error message (if failed) */
  error?: string;

  /** Cost of this generation in credits/USD */
  cost?: number;

  /** Timestamp of generation */
  generatedAt?: string;
}

// ============================================================================
// Image Proposal Types (Hybrid Approval Flow)
// ============================================================================

/**
 * Status of an image proposal in the approval workflow
 */
export type ProposalStatus =
  | 'pending'       // Waiting for user decision
  | 'approved'      // User approved, ready to generate
  | 'generated'     // Image has been generated
  | 'regenerating'  // User requested regeneration
  | 'rejected'      // User rejected/skipped this image
  | 'failed';       // Generation failed

/**
 * A proposed image based on visual markers from generated content
 */
export interface ImageProposal {
  /** Unique ID for this proposal */
  id: string;

  /** Reference to the visual marker that triggered this proposal */
  markerId: string;

  /** Original description from the {{IMAGE:...}} marker */
  originalDescription: string;

  /** Enhanced prompt for Imagen 3 (with educational context) */
  enhancedPrompt: string;

  /** Detected image type */
  imageType: ImageType;

  /** Current status in the approval workflow */
  status: ProposalStatus;

  /** Position in the content where this image should appear */
  contentPosition: number;

  /** Generated image data (if status is 'generated') */
  generatedImage?: ImageGenerationResponse;

  /** Timestamp when proposed */
  proposedAt: string;

  /** User's decision timestamp */
  decidedAt?: string;

  /** Number of regeneration attempts */
  regenerationCount: number;
}

// ============================================================================
// Educational Image Enhancement
// ============================================================================

/**
 * Educational enhancements to apply to image prompts
 */
export interface EducationalEnhancement {
  /** Add clear labels and annotations */
  addLabels: boolean;

  /** Use educational color coding */
  useColorCoding: boolean;

  /** Include step numbers for processes */
  includeStepNumbers: boolean;

  /** Emphasize key concepts visually */
  emphasizeKeyConcepts: boolean;

  /** Use arrows to show relationships/flow */
  useArrows: boolean;

  /** Add visual hierarchy (size/prominence) */
  useVisualHierarchy: boolean;

  /** Include legend/key if needed */
  includeLegend: boolean;
}

/**
 * Settings for enhancing an image prompt with educational context
 */
export interface ImageEnhancementSettings {
  /** Base prompt from visual marker */
  basePrompt: string;

  /** Educational context from the material */
  educationalContext: string;

  /** Subject area (e.g., "biology", "computer science") */
  subjectArea?: string;

  /** Educational level (e.g., "undergraduate", "graduate") */
  educationalLevel?: 'high-school' | 'undergraduate' | 'graduate' | 'professional';

  /** Specific enhancements to apply */
  enhancements: EducationalEnhancement;

  /** Image type for context-appropriate styling */
  imageType: ImageType;
}

// ============================================================================
// Material Image Data
// ============================================================================

/**
 * Complete image data for a generated study material
 */
export interface MaterialImageData {
  /** Material ID this image data belongs to */
  materialId: string;

  /** All visual markers found in the original content */
  visualMarkers: VisualMarker[];

  /** Image proposals (max 2 per cost limits) */
  proposals: ImageProposal[];

  /** Final approved/generated images */
  finalImages: ImageGenerationResponse[];

  /** Total cost of all image generations */
  totalCost: number;

  /** Whether the 2-image limit was reached */
  limitReached: boolean;

  /** Timestamp when image processing started */
  processingStartedAt?: string;

  /** Timestamp when image processing completed */
  processingCompletedAt?: string;
}

// ============================================================================
// Cost Tracking
// ============================================================================

/**
 * Cost tracking for Imagen 3 usage
 */
export interface ImageCostTracking {
  /** Total images generated this session */
  imagesGenerated: number;

  /** Total cost in USD */
  totalCostUSD: number;

  /** Cost per material breakdown */
  costByMaterial: Record<string, number>;

  /** Timestamp of tracking start */
  trackingStartedAt: string;

  /** Last updated timestamp */
  lastUpdatedAt: string;

  /** Whether user has exceeded budget warnings */
  budgetWarnings: boolean;

  /** Budget limit in USD (if set) */
  budgetLimit?: number;
}

// ============================================================================
// API Route Types
// ============================================================================

/**
 * Request body for /api/generate-image endpoint
 */
export interface GenerateImageRequestBody {
  /** Image generation parameters */
  request: ImageGenerationRequest;

  /** Material ID for tracking */
  materialId?: string;

  /** Proposal ID if regenerating */
  proposalId?: string;
}

/**
 * Response from /api/generate-image endpoint
 */
export interface GenerateImageResponseBody {
  /** Whether the request was successful */
  success: boolean;

  /** Generated image data */
  image?: ImageGenerationResponse;

  /** Error message if failed */
  error?: string;

  /** Cost of this generation */
  cost?: number;

  /** Remaining budget/quota info */
  remainingQuota?: {
    imagesRemaining: number;
    budgetRemaining?: number;
  };
}

/**
 * Request to parse content for visual markers
 */
export interface ParseMarkersRequestBody {
  /** Content to parse */
  content: string;

  /** Material type for context */
  materialType?: string;
}

/**
 * Response with parsed visual markers
 */
export interface ParseMarkersResponseBody {
  /** Parsed content and markers */
  parsed: ParsedVisualContent;

  /** Automatically generated proposals (max 2) */
  proposals: ImageProposal[];
}
