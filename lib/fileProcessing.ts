/**
 * File Processing Utilities
 * Helper functions for converting and processing files for multi-input workflow
 */

/**
 * Convert a File object to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Prepare images for the analyze-images API
 */
export async function prepareImagesForAPI(files: File[]): Promise<Array<{
  data: string;
  mimeType: string;
  fileName: string;
}>> {
  return await Promise.all(
    files.map(async (file) => ({
      data: await fileToBase64(file),
      mimeType: file.type,
      fileName: file.name
    }))
  );
}

/**
 * Separate slide files into documents (PPTX/PDF) and images
 */
export function separateSlideFiles(files: File[]): {
  documents: File[];
  images: File[];
} {
  const documents: File[] = [];
  const images: File[] = [];

  files.forEach(file => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ext === 'pptx' || ext === 'ppt') {
      documents.push(file);
    } else if (file.type.startsWith('image/')) {
      images.push(file);
    }
  });

  return { documents, images };
}

/**
 * Parse and format API error responses for user display
 */
function parseAPIError(error: any): {
  message: string;
  isRecoverable: boolean;
  isRetryable: boolean;
  suggestions?: string[];
} {
  // Handle structured error responses from our improved APIs
  if (error.details || error.suggestions) {
    return {
      message: error.error || 'An error occurred',
      isRecoverable: true,
      isRetryable: false, // Structured errors are not network issues
      suggestions: error.suggestions || []
    };
  }

  // Handle simple error strings
  const errorMsg = error.error || error.message || String(error);

  // Categorize errors
  if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
    return {
      message: 'File processing timed out',
      isRecoverable: false,
      isRetryable: false, // Timeout likely means file is too large
      suggestions: [
        'Try a smaller file',
        'Check if the file is corrupted',
        'Split large PDFs into smaller sections'
      ]
    };
  }

  if (errorMsg.includes('extractable text') || errorMsg.includes('image-based')) {
    return {
      message: 'PDF contains no selectable text',
      isRecoverable: true,
      isRetryable: false, // Content issue, not network
      suggestions: [
        'This appears to be a scanned or image-based PDF',
        'Try uploading the pages as images instead',
        'Use OCR software to convert the PDF to text first'
      ]
    };
  }

  if (errorMsg.includes('too short') || errorMsg.includes('minimal text')) {
    return {
      message: 'Extracted text is too short',
      isRecoverable: true,
      isRetryable: false, // Content issue, not network
      suggestions: [
        'The file may be mostly images',
        'Try uploading the content as images',
        'Check if the file has actual content'
      ]
    };
  }

  if (errorMsg.includes('too large') || errorMsg.includes('file size')) {
    return {
      message: 'File is too large to process',
      isRecoverable: false,
      isRetryable: false, // Size issue, won't help to retry
      suggestions: [
        'Try a smaller file (under 10MB)',
        'Compress the PDF',
        'Split into multiple smaller files'
      ]
    };
  }

  // Network or server errors (RETRYABLE)
  if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
    return {
      message: 'Network error during file processing',
      isRecoverable: true,
      isRetryable: true, // Network errors can be retried
      suggestions: [
        'Check your internet connection',
        'Try again in a moment',
        'Refresh the page if the issue persists'
      ]
    };
  }

  // Server errors (500, 502, 503, etc.) - RETRYABLE
  if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503') || errorMsg.includes('Server error')) {
    return {
      message: 'Server error - this is usually temporary',
      isRecoverable: true,
      isRetryable: true,
      suggestions: [
        'The server is experiencing issues',
        'Retrying automatically...',
        'If this persists, try again later'
      ]
    };
  }

  // Default case
  return {
    message: errorMsg,
    isRecoverable: false,
    isRetryable: false,
    suggestions: ['Try a different file', 'Contact support if the issue persists']
  };
}

/**
 * Retry wrapper for handling transient network failures
 * Only retries if the error is network-related (not content issues)
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  errorContext: string = 'Operation'
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      // Check if error is retryable
      const parsedError = parseAPIError(err);

      if (!parsedError.isRetryable) {
        // Not a network error, don't retry
        console.warn(`${errorContext} failed with non-retryable error:`, parsedError.message);
        throw err;
      }

      // If we have retries left, wait and try again
      if (attempt < maxRetries) {
        const delay = 1000 * (attempt + 1); // 1s, 2s delays
        console.log(`${errorContext} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`${errorContext} failed after ${maxRetries + 1} attempts`);
      }
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Extract text from slide files (PPTX, PDF) with fallback to vision AI
 */
export async function extractSlideContent(files: File[]): Promise<string | null> {
  if (files.length === 0) return null;

  const { documents, images } = separateSlideFiles(files);

  // First, try text extraction for documents
  let extractedText = '';
  const failedDocuments: File[] = [];
  const extractionErrors: any[] = [];

  if (documents.length > 0) {
    const formData = new FormData();
    documents.forEach(file => {
      formData.append('files', file);
    });

    try {
      // Wrap fetch in retry logic for network failures
      const response = await withRetry(
        () => fetch('/api/extract-slides', {
          method: 'POST',
          body: formData,
        }),
        2, // max 2 retries
        'PDF/PPTX extraction'
      );

      if (!response.ok) {
        const contentType = response.headers.get('content-type');

        // Check if response is HTML (Next.js error page)
        if (contentType?.includes('text/html')) {
          const htmlText = await response.text();
          console.error('Received HTML error page instead of JSON');
          console.error('HTML content (first 500 chars):', htmlText.substring(0, 500));

          // Try to extract error message from HTML
          // Use [\s\S] instead of . with /s flag for ES5 compatibility
          const errorMatch = htmlText.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
          if (errorMatch) {
            console.error('Extracted error:', errorMatch[1]);
          }

          const parsedError = parseAPIError({ message: 'Server error during slide extraction' });
          alert(`⚠️ ${parsedError.message}\n\n${parsedError.suggestions?.join('\n• ') || ''}`);
          throw new Error(parsedError.message);
        }

        // Try to parse JSON error
        try {
          const error = await response.json();
          const parsedError = parseAPIError(error);

          // Display user-friendly error message
          if (parsedError.suggestions && parsedError.suggestions.length > 0) {
            alert(`⚠️ ${parsedError.message}\n\nSuggestions:\n• ${parsedError.suggestions.join('\n• ')}`);
          } else {
            alert(`⚠️ ${parsedError.message}`);
          }

          throw new Error(parsedError.message);
        } catch (jsonError) {
          const parsedError = parseAPIError({ message: `Failed to extract slide content (${response.status} ${response.statusText})` });
          alert(`⚠️ ${parsedError.message}`);
          throw new Error(parsedError.message);
        }
      }

      const data = await response.json();
      console.log('Slide extraction response:', data);

      // Check if extraction was successful for each file
      if (data.results) {
        data.results.forEach((result: any, index: number) => {
          const wordCount = result.text ? result.text.split(/\s+/).filter((w: string) => w.length > 0).length : 0;

          // Track extraction errors for each file
          if (result.error) {
            extractionErrors.push({
              fileName: result.fileName,
              type: result.type || 'pdf',
              error: result.error,
              warning: result.warning
            });

            const parsedError = parseAPIError({ error: result.error });
            console.warn(`File ${result.fileName}: ${parsedError.message}`);

            // Show specific error for this file
            if (parsedError.suggestions && parsedError.suggestions.length > 0) {
              console.warn(`Suggestions for ${result.fileName}:`, parsedError.suggestions);
            }
          }

          // If extraction failed or returned very little text (< 20 words), mark for fallback
          if (result.error || !result.text || wordCount < 20) {
            console.warn(`File ${result.fileName} extraction poor (${wordCount} words), will try vision AI fallback`);
            failedDocuments.push(documents[index]);
          }
        });
      }

      extractedText = data.combinedText || '';
    } catch (error: any) {
      console.error('Text extraction completely failed:', error);
      const parsedError = parseAPIError(error);

      // Don't show alert here if we already showed one above
      if (!error.message || !error.message.includes('Server error')) {
        if (parsedError.suggestions && parsedError.suggestions.length > 0) {
          alert(`⚠️ Extraction failed: ${parsedError.message}\n\nSuggestions:\n• ${parsedError.suggestions.join('\n• ')}`);
        } else {
          alert(`⚠️ Extraction failed: ${parsedError.message}`);
        }
      }

      // All documents failed, add them all to fallback
      failedDocuments.push(...documents);
      extractionErrors.push({
        type: 'pdf',
        error: parsedError.message
      });
    }
  }

  // Store extraction errors for potential use in generate-materials
  (extractSlideContent as any).lastExtractionErrors = extractionErrors;

  // Process image slides
  let imageAnalysis = '';
  const allImagesToAnalyze = [...images];

  // If some documents failed extraction or had poor results, we could convert them to images
  // For now, we'll just note that vision AI could be used as a fallback
  // (Converting PDF/PPTX to images requires additional libraries like pdf2pic)

  if (allImagesToAnalyze.length > 0) {
    try {
      const analysis = await analyzeImageContent(allImagesToAnalyze);
      imageAnalysis = analysis || '';
    } catch (error: any) {
      console.error('Image analysis failed:', error);
      // Continue without image analysis
    }
  }

  // Combine results
  const combined = [extractedText, imageAnalysis]
    .filter(text => text && text.trim())
    .join('\n\n--- Image Analysis ---\n\n');

  console.log('Final slide extraction result:', {
    hasExtractedText: !!extractedText,
    hasImageAnalysis: !!imageAnalysis,
    combinedLength: combined.length
  });

  return combined || null;
}

/**
 * Analyze images using Gemini Vision
 */
export async function analyzeImageContent(files: File[], modelTier?: string): Promise<string | null> {
  if (files.length === 0) return null;

  // Convert files to base64 format
  const images = await prepareImagesForAPI(files);

  // Wrap fetch in retry logic for network failures
  const response = await withRetry(
    () => fetch('/api/analyze-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images, modelTier }),
    }),
    2, // max 2 retries
    'Image analysis'
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze images');
  }

  const data = await response.json();
  return data.combinedAnalysis || null;
}

/**
 * Process all slide files (both documents and images)
 * Documents are extracted via text extraction
 * Images are analyzed via Gemini Vision
 */
export async function processAllSlideFiles(files: File[]): Promise<{
  documentText: string | null;
  imageAnalysis: string | null;
  combined: string | null;
}> {
  const { documents, images } = separateSlideFiles(files);

  // Process both in parallel
  const [documentText, imageAnalysis] = await Promise.all([
    documents.length > 0 ? extractSlideContent(documents) : Promise.resolve(null),
    images.length > 0 ? analyzeImageContent(images) : Promise.resolve(null),
  ]);

  // Combine results
  const combined = [documentText, imageAnalysis]
    .filter(text => text && text.trim())
    .join('\n\n---\n\n');

  return {
    documentText,
    imageAnalysis,
    combined: combined || null,
  };
}

/**
 * Create FormData from files
 */
export function createFormData(files: File[], fieldName: string = 'file'): FormData {
  const formData = new FormData();
  if (files.length === 1) {
    formData.append(fieldName, files[0]);
  } else {
    files.forEach((file, index) => {
      formData.append(`${fieldName}${index}`, file);
    });
  }
  return formData;
}

/**
 * Get the last extraction errors from extractSlideContent
 * These can be passed to generate-materials for better error handling
 */
export function getLastExtractionErrors(): any[] {
  return (extractSlideContent as any).lastExtractionErrors || [];
}

/**
 * Clear stored extraction errors
 */
export function clearExtractionErrors() {
  (extractSlideContent as any).lastExtractionErrors = [];
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return allowedTypes.includes(ext || '');
}
