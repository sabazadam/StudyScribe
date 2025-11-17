/**
 * Context Merger Utility
 * Combines multiple sources of lecture content (transcript, slides, photos) into a unified context
 * for optimal LLM understanding and generation
 */

export interface ContextSources {
  transcript?: string;
  slideText?: string;
  imageAnalysis?: string;
  additionalNotes?: string;
}

export interface MergedContext {
  combinedContent: string;
  sources: {
    hasTranscript: boolean;
    hasSlides: boolean;
    hasImages: boolean;
    hasNotes: boolean;
  };
  stats: {
    totalWords: number;
    transcriptWords: number;
    slideWords: number;
    imageWords: number;
  };
}

/**
 * Merge all context sources into a structured format optimized for LLM processing
 */
export function mergeContexts(sources: ContextSources): MergedContext {
  const { transcript, slideText, imageAnalysis, additionalNotes } = sources;

  // Calculate word counts
  const countWords = (text?: string) => text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;

  const transcriptWords = countWords(transcript);
  const slideWords = countWords(slideText);
  const imageWords = countWords(imageAnalysis);
  const notesWords = countWords(additionalNotes);

  // Build the combined content with clear section markers
  const sections: string[] = [];

  // Always include transcript as the primary source
  if (transcript && transcript.trim()) {
    sections.push(
      `## 📝 LECTURE TRANSCRIPT (Spoken Content)\n\n${transcript.trim()}`
    );
  }

  // Add slide content if available
  if (slideText && slideText.trim()) {
    sections.push(
      `## 📊 SLIDE CONTENT (Presentation Materials)\n\n${slideText.trim()}`
    );
  }

  // Add image analysis if available
  if (imageAnalysis && imageAnalysis.trim()) {
    sections.push(
      `## 📷 VISUAL MATERIALS (Photos & Diagrams)\n\n${imageAnalysis.trim()}`
    );
  }

  // Add any additional notes
  if (additionalNotes && additionalNotes.trim()) {
    sections.push(
      `## 📌 ADDITIONAL NOTES\n\n${additionalNotes.trim()}`
    );
  }

  // Create the final combined content
  const combinedContent = sections.join('\n\n---\n\n');

  return {
    combinedContent,
    sources: {
      hasTranscript: !!(transcript && transcript.trim()),
      hasSlides: !!(slideText && slideText.trim()),
      hasImages: !!(imageAnalysis && imageAnalysis.trim()),
      hasNotes: !!(additionalNotes && additionalNotes.trim()),
    },
    stats: {
      totalWords: transcriptWords + slideWords + imageWords + notesWords,
      transcriptWords,
      slideWords,
      imageWords,
    },
  };
}

/**
 * Create an enhanced prompt that instructs the LLM how to use multiple sources
 */
export function createEnhancedPrompt(
  basePrompt: string,
  mergedContext: MergedContext
): string {
  const { sources } = mergedContext;

  // Build source instruction
  const availableSources: string[] = [];
  if (sources.hasTranscript) availableSources.push('lecture transcript (spoken content)');
  if (sources.hasSlides) availableSources.push('presentation slides');
  if (sources.hasImages) availableSources.push('visual materials (photos, diagrams, whiteboards)');

  const sourceInstruction = availableSources.length > 1
    ? `\n\n**IMPORTANT**: You have access to ${availableSources.length} sources: ${availableSources.join(', ')}. Synthesize information from ALL sources to create comprehensive materials. Cross-reference between sources and fill any gaps. If the same concept appears in multiple sources, combine the information for a richer explanation.`
    : '';

  return basePrompt + sourceInstruction;
}

/**
 * Validate that we have sufficient context to generate materials
 */
export function validateContext(sources: ContextSources): {
  valid: boolean;
  message?: string;
  details?: string[];
} {
  // Check if at least one source has content
  const hasTranscript = !!(sources.transcript && sources.transcript.trim().length >= 50);
  const hasSlideText = !!(sources.slideText && sources.slideText.trim().length >= 50);
  const hasImageAnalysis = !!(sources.imageAnalysis && sources.imageAnalysis.trim().length >= 50);

  const details: string[] = [];

  // Provide specific feedback about each source
  if (sources.transcript) {
    if (sources.transcript.trim().length < 50) {
      details.push('• Audio transcript is too short (less than 50 characters). The audio may have failed to transcribe or was too brief.');
    }
  }

  if (sources.slideText) {
    if (sources.slideText.trim().length < 50) {
      details.push('• Slide content is too short. PDF may be image-based, scanned, or contain mostly graphics. Try uploading images separately.');
    }
  }

  if (sources.imageAnalysis) {
    if (sources.imageAnalysis.trim().length < 50) {
      details.push('• Image analysis returned minimal content. Images may be unclear or lack educational content.');
    }
  }

  if (!hasTranscript && !hasSlideText && !hasImageAnalysis) {
    return {
      valid: false,
      message: 'Insufficient content: All sources are empty or too short',
      details: details.length > 0 ? details : [
        '• No valid content extracted from any source',
        '• Ensure files contain readable text or clear images',
        '• For PDFs: Check that text is selectable (not scanned)',
        '• For audio: Ensure clear speech and sufficient duration',
        '• For images: Use clear, well-lit photos of educational content'
      ]
    };
  }

  const mergedContext = mergeContexts(sources);

  if (mergedContext.stats.totalWords < 100) {
    const sources: string[] = [];
    if (hasTranscript) sources.push(`transcript (${mergedContext.stats.transcriptWords} words)`);
    if (hasSlideText) sources.push(`slides (${mergedContext.stats.slideWords} words)`);
    if (hasImageAnalysis) sources.push(`images (${mergedContext.stats.imageWords} words)`);

    return {
      valid: false,
      message: `Insufficient content: Only ${mergedContext.stats.totalWords} words extracted`,
      details: [
        `• Current sources: ${sources.join(', ')}`,
        '• Need at least 100 words to generate comprehensive study materials',
        '• Try adding more content sources or longer materials',
        ...details
      ]
    };
  }

  return { valid: true };
}

/**
 * Remove duplicate content that might appear in multiple sources
 * This is a simple implementation - could be enhanced with more sophisticated similarity detection
 */
export function deduplicate(text: string): string {
  // Split into sentences
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

  // Remove exact duplicates
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase().replace(/\s+/g, ' ');
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(sentence);
    }
  }

  return unique.join('. ') + '.';
}

/**
 * Extract key information from merged context
 */
export function extractKeyInfo(mergedContext: MergedContext): {
  topics: string[];
  hasFormulas: boolean;
  hasDiagrams: boolean;
  estimatedDuration: number; // in minutes
} {
  const content = mergedContext.combinedContent.toLowerCase();

  // Simple topic extraction (look for capitalized phrases)
  const topics: string[] = [];
  const topicMatches = mergedContext.combinedContent.match(/^#+\s+(.+)$/gm);
  if (topicMatches) {
    topics.push(...topicMatches.map(m => m.replace(/^#+\s+/, '').trim()));
  }

  // Check for formulas (look for LaTeX or mathematical symbols)
  const hasFormulas = /\$[^$]+\$|\\frac|\\sum|\\int|[∫∑∏√π]/.test(content);

  // Check for diagrams (look for diagram-related keywords in image analysis)
  const hasDiagrams = /diagram|chart|graph|illustration|drawing|flowchart|table/i.test(content);

  // Estimate duration based on word count (average speaking rate: 150 words/minute)
  const estimatedDuration = Math.ceil(mergedContext.stats.transcriptWords / 150);

  return {
    topics,
    hasFormulas,
    hasDiagrams,
    estimatedDuration,
  };
}
