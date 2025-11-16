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
 * Extract text from slide files (PPTX, PDF) with fallback to vision AI
 */
export async function extractSlideContent(files: File[]): Promise<string | null> {
  if (files.length === 0) return null;

  const { documents, images } = separateSlideFiles(files);

  // First, try text extraction for documents
  let extractedText = '';
  const failedDocuments: File[] = [];

  if (documents.length > 0) {
    const formData = new FormData();
    documents.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/extract-slides', {
        method: 'POST',
        body: formData,
      });

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

          throw new Error('Server error during slide extraction');
        }

        // Try to parse JSON error
        try {
          const error = await response.json();
          throw new Error(error.error || error.details || 'Failed to extract slide content');
        } catch (jsonError) {
          throw new Error(`Failed to extract slide content (${response.status} ${response.statusText})`);
        }
      }

      const data = await response.json();
      console.log('Slide extraction response:', data);

      // Check if extraction was successful for each file
      if (data.results) {
        data.results.forEach((result: any, index: number) => {
          const wordCount = result.text ? result.text.split(/\s+/).filter((w: string) => w.length > 0).length : 0;

          // If extraction failed or returned very little text (< 20 words), mark for fallback
          if (result.error || !result.text || wordCount < 20) {
            console.warn(`File ${result.fileName} extraction poor (${wordCount} words), will try vision AI fallback`);
            failedDocuments.push(documents[index]);
          }
        });
      }

      extractedText = data.combinedText || '';
    } catch (error: any) {
      console.error('Text extraction completely failed, will try vision AI fallback:', error);
      // All documents failed, add them all to fallback
      failedDocuments.push(...documents);
    }
  }

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
export async function analyzeImageContent(files: File[]): Promise<string | null> {
  if (files.length === 0) return null;

  // Convert files to base64 format
  const images = await prepareImagesForAPI(files);

  const response = await fetch('/api/analyze-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images }),
  });

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
