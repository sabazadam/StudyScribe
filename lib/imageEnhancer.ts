/**
 * Image Enhancement Utility for CrammingAI
 *
 * This utility provides functions for:
 * - Parsing visual markers ({{IMAGE:...}}) from generated content
 * - Enhancing image prompts with educational context
 * - Generating image proposals for user approval
 * - Managing the hybrid approval workflow
 *
 * Cost Control: Maximum 2 images per material
 */

import {
  VisualMarker,
  ParsedVisualContent,
  ImageProposal,
  ImageType,
  ProposalStatus,
  ImageEnhancementSettings,
  EducationalEnhancement,
  ImageGenerationRequest,
} from './types/image';

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of images allowed per material (cost control) */
export const MAX_IMAGES_PER_MATERIAL = 2;

/** Regular expression to match {{IMAGE:description}} markers */
const IMAGE_MARKER_REGEX = /\{\{IMAGE:([^}]+)\}\}/g;

/** Educational enhancement presets by image type */
const ENHANCEMENT_PRESETS: Record<ImageType, Partial<EducationalEnhancement>> = {
  flowchart: {
    addLabels: true,
    useArrows: true,
    includeStepNumbers: true,
    useColorCoding: true,
  },
  diagram: {
    addLabels: true,
    useVisualHierarchy: true,
    includeLegend: true,
  },
  comparison: {
    addLabels: true,
    useColorCoding: true,
    useVisualHierarchy: true,
  },
  hierarchy: {
    addLabels: true,
    useVisualHierarchy: true,
    useArrows: false,
  },
  cycle: {
    addLabels: true,
    useArrows: true,
    includeStepNumbers: true,
  },
  'concept-map': {
    addLabels: true,
    useArrows: true,
    useColorCoding: true,
  },
  system: {
    addLabels: true,
    useVisualHierarchy: true,
    includeLegend: true,
  },
  process: {
    addLabels: true,
    useArrows: true,
    includeStepNumbers: true,
  },
  timeline: {
    addLabels: true,
    includeStepNumbers: true,
  },
  relationship: {
    addLabels: true,
    useArrows: true,
    useColorCoding: true,
  },
  other: {
    addLabels: true,
  },
};

// ============================================================================
// Visual Marker Parsing
// ============================================================================

/**
 * Parses content to extract visual markers and generate clean content
 *
 * @param content - Raw content with {{IMAGE:...}} markers
 * @returns Parsed visual content with markers and clean text
 */
export function parseVisualMarkers(content: string): ParsedVisualContent {
  const markers: VisualMarker[] = [];
  let cleanContent = content;
  let contentWithPlaceholders = content;
  let match;

  // Reset regex state
  IMAGE_MARKER_REGEX.lastIndex = 0;

  // Extract all markers
  while ((match = IMAGE_MARKER_REGEX.exec(content)) !== null) {
    const rawMarker = match[0];
    const description = match[1].trim();
    const position = match.index;

    const marker: VisualMarker = {
      rawMarker,
      description,
      position,
      id: generateMarkerId(markers.length),
    };

    markers.push(marker);
  }

  // Remove markers from content
  cleanContent = content.replace(IMAGE_MARKER_REGEX, '');

  // Replace markers with placeholders
  markers.forEach((marker, index) => {
    contentWithPlaceholders = contentWithPlaceholders.replace(
      marker.rawMarker,
      `[Image ${index + 1}: ${marker.description}]`
    );
  });

  return {
    markers,
    cleanContent,
    contentWithPlaceholders,
    markerCount: markers.length,
  };
}

/**
 * Generates a unique ID for a visual marker
 */
function generateMarkerId(index: number): string {
  return `marker_${Date.now()}_${index}`;
}

// ============================================================================
// Image Type Detection
// ============================================================================

/**
 * Detects the image type from a description
 *
 * @param description - Image description from marker
 * @returns Detected image type
 */
export function detectImageType(description: string): ImageType {
  const lowerDesc = description.toLowerCase();

  // Check for explicit type mentions
  if (lowerDesc.includes('flowchart') || lowerDesc.includes('flow chart')) {
    return 'flowchart';
  }
  if (lowerDesc.includes('comparison') || lowerDesc.includes('vs') || lowerDesc.includes('versus')) {
    return 'comparison';
  }
  if (lowerDesc.includes('hierarchy') || lowerDesc.includes('tree')) {
    return 'hierarchy';
  }
  if (lowerDesc.includes('cycle') || lowerDesc.includes('circular')) {
    return 'cycle';
  }
  if (lowerDesc.includes('concept map') || lowerDesc.includes('mind map')) {
    return 'concept-map';
  }
  if (lowerDesc.includes('system') || lowerDesc.includes('architecture')) {
    return 'system';
  }
  if (lowerDesc.includes('process') || lowerDesc.includes('steps')) {
    return 'process';
  }
  if (lowerDesc.includes('timeline') || lowerDesc.includes('chronological')) {
    return 'timeline';
  }
  if (lowerDesc.includes('relationship') || lowerDesc.includes('how') && lowerDesc.includes('relate')) {
    return 'relationship';
  }
  if (lowerDesc.includes('diagram')) {
    return 'diagram';
  }

  // Default to other
  return 'other';
}

// ============================================================================
// Prompt Enhancement
// ============================================================================

/**
 * Enhances an image prompt with educational context and styling
 *
 * @param settings - Enhancement settings
 * @returns Enhanced prompt for Imagen 3
 */
export function enhanceImagePrompt(settings: ImageEnhancementSettings): string {
  const {
    basePrompt,
    educationalContext,
    subjectArea,
    educationalLevel,
    enhancements,
    imageType,
  } = settings;

  // Start with base educational style
  let enhancedPrompt = 'Educational diagram: ';

  // Add the base prompt
  enhancedPrompt += basePrompt;

  // Add educational styling instructions
  const styleElements: string[] = [];

  if (enhancements.addLabels) {
    styleElements.push('clear labels and annotations');
  }
  if (enhancements.useColorCoding) {
    styleElements.push('color-coded elements for easy distinction');
  }
  if (enhancements.includeStepNumbers) {
    styleElements.push('numbered steps in sequence');
  }
  if (enhancements.emphasizeKeyConcepts) {
    styleElements.push('emphasized key concepts');
  }
  if (enhancements.useArrows) {
    styleElements.push('directional arrows showing flow and relationships');
  }
  if (enhancements.useVisualHierarchy) {
    styleElements.push('visual hierarchy with different sizes and prominence');
  }
  if (enhancements.includeLegend) {
    styleElements.push('legend or key for symbols and colors');
  }

  if (styleElements.length > 0) {
    enhancedPrompt += '. Style: ' + styleElements.join(', ');
  }

  // Add educational level context
  if (educationalLevel) {
    const levelDescriptions = {
      'high-school': 'simple and accessible for high school students',
      'undergraduate': 'suitable for undergraduate university students',
      'graduate': 'detailed and suitable for graduate-level study',
      'professional': 'professional and technical depth',
    };
    enhancedPrompt += `. Design for ${levelDescriptions[educationalLevel]}`;
  }

  // Add subject area if provided
  if (subjectArea) {
    enhancedPrompt += `. Subject: ${subjectArea}`;
  }

  // Add general educational styling
  enhancedPrompt += '. Clean, professional academic style with high contrast and readability.';

  // Add context-specific details
  if (educationalContext) {
    // Extract key terms from context (first 200 chars)
    const contextSnippet = educationalContext.substring(0, 200);
    enhancedPrompt += ` Context: ${contextSnippet}...`;
  }

  return enhancedPrompt;
}

/**
 * Creates default educational enhancements based on image type
 */
export function createDefaultEnhancements(imageType: ImageType): EducationalEnhancement {
  const preset = ENHANCEMENT_PRESETS[imageType] || {};

  return {
    addLabels: preset.addLabels ?? true,
    useColorCoding: preset.useColorCoding ?? false,
    includeStepNumbers: preset.includeStepNumbers ?? false,
    emphasizeKeyConcepts: preset.emphasizeKeyConcepts ?? true,
    useArrows: preset.useArrows ?? false,
    useVisualHierarchy: preset.useVisualHierarchy ?? false,
    includeLegend: preset.includeLegend ?? false,
  };
}

// ============================================================================
// Image Proposal Generation
// ============================================================================

/**
 * Generates image proposals from visual markers
 * Enforces user-specified or default maximum limit
 *
 * @param markers - Visual markers extracted from content
 * @param educationalContext - Context from the material
 * @param options - Additional options including maxImages (0-2)
 * @returns Array of image proposals (respects maxImages limit)
 */
export function generateImageProposals(
  markers: VisualMarker[],
  educationalContext: string,
  options: {
    subjectArea?: string;
    educationalLevel?: 'high-school' | 'undergraduate' | 'graduate' | 'professional';
    materialType?: string;
    maxImages?: number; // User-adjustable limit (0-2)
  } = {}
): ImageProposal[] {
  // Enforce maximum images limit (user preference or default)
  const maxImages = options.maxImages !== undefined
    ? Math.min(Math.max(0, options.maxImages), MAX_IMAGES_PER_MATERIAL) // Clamp between 0 and 2
    : MAX_IMAGES_PER_MATERIAL; // Default to 2

  const limitedMarkers = markers.slice(0, maxImages);

  const proposals: ImageProposal[] = limitedMarkers.map((marker, index) => {
    const imageType = detectImageType(marker.description);
    const enhancements = createDefaultEnhancements(imageType);

    const enhancedPrompt = enhanceImagePrompt({
      basePrompt: marker.description,
      educationalContext,
      subjectArea: options.subjectArea,
      educationalLevel: options.educationalLevel,
      enhancements,
      imageType,
    });

    return {
      id: generateProposalId(index),
      markerId: marker.id,
      originalDescription: marker.description,
      enhancedPrompt,
      imageType,
      status: 'pending',
      contentPosition: marker.position,
      proposedAt: new Date().toISOString(),
      regenerationCount: 0,
    };
  });

  return proposals;
}

/**
 * Generates a unique ID for an image proposal
 */
function generateProposalId(index: number): string {
  return `proposal_${Date.now()}_${index}`;
}

// ============================================================================
// Image Generation Request Builder
// ============================================================================

/**
 * Builds an Imagen 3 generation request from a proposal
 *
 * @param proposal - Image proposal
 * @param options - Additional options
 * @returns Image generation request
 */
export function buildGenerationRequest(
  proposal: ImageProposal,
  options: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    numberOfImages?: number;
  } = {}
): ImageGenerationRequest {
  return {
    prompt: proposal.enhancedPrompt,
    educationalContext: proposal.originalDescription,
    imageType: proposal.imageType,
    aspectRatio: options.aspectRatio || getDefaultAspectRatio(proposal.imageType),
    negativePrompt: getEducationalNegativePrompt(),
    numberOfImages: options.numberOfImages || 1,
  };
}

/**
 * Gets the default aspect ratio for an image type
 */
function getDefaultAspectRatio(imageType: ImageType): '1:1' | '16:9' | '9:16' | '4:3' | '3:4' {
  switch (imageType) {
    case 'flowchart':
    case 'process':
    case 'timeline':
      return '16:9'; // Wide for horizontal flow
    case 'hierarchy':
    case 'cycle':
      return '1:1'; // Square for radial/tree layouts
    default:
      return '4:3'; // Standard for most diagrams
  }
}

/**
 * Returns a negative prompt to avoid unwanted elements in educational images
 */
function getEducationalNegativePrompt(): string {
  return [
    'photorealistic',
    'photograph',
    'realistic people',
    'faces',
    '3D render',
    'cluttered',
    'busy background',
    'decorative elements',
    'artistic effects',
    'shadows',
    'gradient backgrounds',
    'low contrast',
    'blurry text',
    'illegible labels',
  ].join(', ');
}

// ============================================================================
// Proposal Management
// ============================================================================

/**
 * Updates a proposal's status
 */
export function updateProposalStatus(
  proposal: ImageProposal,
  newStatus: ProposalStatus
): ImageProposal {
  return {
    ...proposal,
    status: newStatus,
    decidedAt: new Date().toISOString(),
  };
}

/**
 * Marks a proposal for regeneration
 */
export function regenerateProposal(proposal: ImageProposal): ImageProposal {
  return {
    ...proposal,
    status: 'regenerating',
    regenerationCount: proposal.regenerationCount + 1,
    decidedAt: new Date().toISOString(),
  };
}

/**
 * Filters proposals to only approved/generated ones
 */
export function getApprovedProposals(proposals: ImageProposal[]): ImageProposal[] {
  return proposals.filter(
    (p) => p.status === 'approved' || p.status === 'generated'
  );
}

/**
 * Checks if the image limit has been reached
 */
export function hasReachedImageLimit(proposals: ImageProposal[]): boolean {
  const approvedOrGenerated = getApprovedProposals(proposals);
  return approvedOrGenerated.length >= MAX_IMAGES_PER_MATERIAL;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extracts subject area from material type or content
 */
export function extractSubjectArea(
  materialType: string,
  content: string
): string | undefined {
  // This could be enhanced with NLP or keyword matching
  // For now, return undefined and let it be manually specified
  return undefined;
}

/**
 * Estimates the educational level from content complexity
 */
export function estimateEducationalLevel(
  content: string
): 'high-school' | 'undergraduate' | 'graduate' | 'professional' {
  // Simple heuristic based on content length and complexity
  // This could be enhanced with more sophisticated analysis

  const wordCount = content.split(/\s+/).length;
  const avgWordLength = content.length / wordCount;
  const hasComplexTerms = /\b(methodology|paradigm|conceptual|theoretical|framework)\b/i.test(content);

  if (wordCount > 5000 || avgWordLength > 6 || hasComplexTerms) {
    return 'graduate';
  } else if (wordCount > 2000 || avgWordLength > 5) {
    return 'undergraduate';
  } else {
    return 'high-school';
  }
}
