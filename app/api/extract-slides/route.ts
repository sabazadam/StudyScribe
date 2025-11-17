import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

// Configure route timeout (60 seconds for large file processing)
export const maxDuration = 60;

// Memory management helper
function forceGarbageCollection() {
  if (global.gc) {
    try {
      global.gc();
      console.log('✓ Garbage collection completed');
    } catch (err) {
      console.warn('⚠️  Garbage collection failed:', err);
    }
  }
}

// Add process-level error handlers to prevent server crashes
if (typeof process !== 'undefined') {
  // Prevent server crash from unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  Unhandled Rejection in extract-slides:', reason);
    console.error('Promise:', promise);
    // Don't exit - log and continue
  });

  // Prevent server crash from uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('⚠️  Uncaught Exception in extract-slides:', error);
    console.error('Stack:', error.stack);
    // Don't exit - log and continue
  });
}

// PDF-parse module initialization with workaround for debug bug
// We mock fs.readFileSync ONLY during module load to prevent the debug file error
// This is safer than mocking on every request (no race conditions)
let pdfParse: any;

// Only mock during initial module load
if (typeof pdfParse === 'undefined') {
  const fs = require('fs');
  const originalReadFileSync = fs.readFileSync;

  // Temporarily mock readFileSync to ignore the debug file
  fs.readFileSync = function(path: string, ...args: any[]) {
    if (typeof path === 'string' && path.includes('test/data/05-versions-space.pdf')) {
      // Return empty buffer for the debug file that pdf-parse tries to load
      return Buffer.from('');
    }
    return originalReadFileSync.call(fs, path, ...args);
  };

  try {
    // Load pdf-parse with the mock in place
    pdfParse = require('pdf-parse');
  } finally {
    // Immediately restore original function
    fs.readFileSync = originalReadFileSync;
  }
}

// File upload validation constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const MAX_FILES = 20;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

/**
 * API endpoint to extract text from slide files (PPTX, PDF)
 * Accepts multipart/form-data with file uploads
 * Returns extracted text content organized by slides
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    console.log('=== EXTRACT-SLIDES API CALLED ===');
    console.log('Files received:', files.length);

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file count
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed. You uploaded ${files.length} files.` },
        { status: 400 }
      );
    }

    // Validate each file
    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File "${file.name}" exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB size limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
          },
          { status: 400 }
        );
      }

      // Check MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `File "${file.name}" has unsupported type: ${file.type}. Allowed types: PDF, PPTX, and images (JPEG, PNG, GIF, WebP)`
          },
          { status: 400 }
        );
      }
    }

    const results = [];

    for (const file of files) {
      const fileName = file.name;
      const fileType = getFileType(fileName);

      console.log('Processing file:', fileName);
      console.log('File type:', file.type);
      console.log('File size:', file.size);
      console.log('Detected type:', fileType);

      try {
        let extractedText = '';
        let extractionError: string | null = null;

        if (fileType === 'pdf') {
          console.log('Extracting PDF...');
          try {
            extractedText = await extractPDFText(file);
            console.log('PDF extracted, text length:', extractedText.length);
          } catch (pdfError: any) {
            // Capture specific PDF error for user feedback
            extractionError = pdfError.message;
            console.error(`PDF extraction failed for ${fileName}:`, extractionError);
          }
        } else if (fileType === 'pptx') {
          console.log('Extracting PPTX...');
          try {
            extractedText = await extractPPTXText(file);
            console.log('PPTX extracted, text length:', extractedText.length);
          } catch (pptxError: any) {
            extractionError = pptxError.message || 'PPTX extraction failed';
            console.error(`PPTX extraction failed for ${fileName}:`, extractionError);
          }
        } else {
          // For images, we'll handle them in the analyze-images endpoint
          console.log('Skipping image file:', fileName);
          results.push({
            fileName,
            type: 'image',
            text: '',
            note: 'Image files should be processed through /api/analyze-images'
          });
          continue;
        }

        const wordCount = extractedText ? extractedText.split(/\s+/).filter(w => w.length > 0).length : 0;

        results.push({
          fileName,
          type: fileType,
          text: extractedText,
          wordCount,
          // Include error if extraction failed
          ...(extractionError ? { error: extractionError, warning: 'Extraction failed - please check file' } : {}),
          // Add a warning if extraction resulted in very little text but no error
          ...(!extractionError && wordCount > 0 && wordCount < 20 ? { warning: 'Low word count - may benefit from vision AI processing' } : {})
        });
      } catch (error: any) {
        // This catch block should rarely be hit now that we handle errors in extraction functions
        console.error(`Unexpected error processing ${fileName}:`, error);
        console.error('Error stack:', error.stack);
        results.push({
          fileName,
          type: fileType,
          text: '',
          error: `Unexpected error: ${error.message || 'Unknown error'}`,
          wordCount: 0
        });
      }
    }

    // Combine all extracted text
    const combinedText = results
      .filter(r => r.text)
      .map(r => `--- ${r.fileName} ---\n${r.text}`)
      .join('\n\n');

    console.log('=== EXTRACTION COMPLETE ===');
    console.log('Total files:', files.length);
    console.log('Successful extractions:', results.filter(r => r.text).length);
    console.log('Failed extractions:', results.filter(r => r.error).length);

    // Force garbage collection after processing to free memory
    forceGarbageCollection();

    return NextResponse.json({
      success: true,
      results,
      combinedText,
      totalFiles: files.length,
      successfulExtractions: results.filter(r => r.text).length
    });
  } catch (error: any) {
    console.error('=== EXTRACT-SLIDES API ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Force garbage collection even on error to free memory
    forceGarbageCollection();

    return NextResponse.json(
      {
        error: error.message || 'Failed to extract slide content',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Determine file type from filename
 */
function getFileType(fileName: string): 'pdf' | 'pptx' | 'image' | 'unknown' {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'pptx' || ext === 'ppt') return 'pptx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
  return 'unknown';
}

/**
 * Extract text from PDF file using pdf-parse with proper error handling and cleanup
 * @param file - PDF file to extract text from
 * @returns Promise<string> - Extracted text
 * @throws Error with descriptive message if extraction fails
 */
async function extractPDFText(file: File): Promise<string> {
  let buffer: Buffer | null = null;

  try {
    console.log('extractPDFText: Starting PDF extraction for', file.name);

    // Validate file size before processing
    const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_PDF_SIZE) {
      throw new Error(`PDF file too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 50MB`);
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    console.log('extractPDFText: PDF loaded, size:', buffer.length, 'bytes');

    // Create a timeout promise to prevent hanging
    const TIMEOUT_MS = 30000; // 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF parsing timeout after 30 seconds')), TIMEOUT_MS);
    });

    // Parse PDF with timeout
    const parsePromise = pdfParse(buffer, {
      max: 0, // Parse all pages
      version: 'default'
    });

    const data = await Promise.race([parsePromise, timeoutPromise]) as any;

    console.log(`extractPDFText: PDF parsed - ${data.numpages} pages`);

    // Validate extraction result
    if (!data || !data.text) {
      console.warn('extractPDFText: No text found in PDF - may be image-based or encrypted');
      throw new Error('PDF contains no extractable text. This may be a scanned document or image-based PDF.');
    }

    // Clean up the text
    let text = data.text
      .replace(/\s+/g, ' ')  // Multiple spaces → single space
      .replace(/\r\n/g, '\n') // Normalize line endings
      .trim();

    const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;

    // Validate minimum content
    if (wordCount < 10) {
      console.warn(`extractPDFText: Very little text extracted (${wordCount} words) - PDF may be corrupted or image-based`);
      throw new Error(`Extracted text is too short (${wordCount} words). PDF may be corrupted or image-based.`);
    }

    console.log(`extractPDFText: SUCCESS! Extracted ${wordCount} words from ${data.numpages} pages`);
    console.log(`extractPDFText: Preview: ${text.substring(0, 150)}...`);

    return text;

  } catch (error) {
    const err = error as Error;
    console.error('extractPDFText: FAILED -', err.message);
    console.error('extractPDFText: Stack:', err.stack);

    // Propagate error with more context
    if (err.message.includes('timeout')) {
      throw new Error(`PDF parsing timeout for "${file.name}". File may be corrupted or too complex.`);
    } else if (err.message.includes('encrypted')) {
      throw new Error(`PDF "${file.name}" is encrypted or password-protected.`);
    } else if (err.message.includes('extractable text') || err.message.includes('too short')) {
      throw err; // Already has good message
    } else {
      throw new Error(`Failed to extract text from "${file.name}": ${err.message}`);
    }
  } finally {
    // Explicitly free buffer memory
    if (buffer) {
      buffer = null;
      if (global.gc) {
        global.gc(); // Force garbage collection if available (node --expose-gc)
      }
    }
  }
}

/**
 * Extract text from PPTX file
 * PPTX files are ZIP archives containing XML files
 */
async function extractPPTXText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  console.log('PPTX: Loaded zip file');
  console.log('PPTX: All files in archive:', Object.keys(zip.files));

  const slideTexts: string[] = [];

  // PPTX slides are in ppt/slides/ directory
  // Get all slide files in order
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/ppt\/slides\/slide\d+\.xml/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  console.log('PPTX: Found slide files:', slideFiles);

  for (const slidePath of slideFiles) {
    const slideFile = zip.files[slidePath];
    if (!slideFile) continue;

    const xmlContent = await slideFile.async('string');
    console.log(`PPTX: Processing ${slidePath}, XML length: ${xmlContent.length}`);

    const text = await extractTextFromSlideXML(xmlContent);
    console.log(`PPTX: Extracted text length from ${slidePath}: ${text.length}`);

    if (text.trim()) {
      const slideNumber = slidePath.match(/slide(\d+)/)?.[1] || '?';
      slideTexts.push(`Slide ${slideNumber}:\n${text}`);
    } else {
      console.log(`PPTX: WARNING - No text extracted from ${slidePath}`);
    }
  }

  console.log(`PPTX: Total slides with text: ${slideTexts.length}`);
  return slideTexts.join('\n\n');
}

/**
 * Extract text from slide XML content
 */
async function extractTextFromSlideXML(xmlContent: string): Promise<string> {
  try {
    // Parse XML with namespace preservation
    const parsed = await parseStringPromise(xmlContent, {
      explicitArray: false,
      mergeAttrs: true,
      xmlns: true
    });

    console.log('PPTX: XML parsed, root keys:', Object.keys(parsed));

    // Extract all text elements from the slide
    // PPTX text can be in several formats depending on namespace handling
    const texts: string[] = [];

    const traverse = (obj: any, depth: number = 0): void => {
      if (!obj) return;
      if (depth > 50) return; // Prevent infinite recursion

      if (typeof obj === 'string') {
        // Direct string value
        const trimmed = obj.trim();
        if (trimmed) {
          texts.push(trimmed);
        }
        return;
      }

      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item, depth + 1));
        return;
      }

      if (typeof obj === 'object') {
        // Look for text elements in multiple formats
        // Format 1: a:t (namespace prefix)
        if (obj['a:t']) {
          extractTextFromElement(obj['a:t']);
        }

        // Format 2: t (no namespace)
        if (obj['t']) {
          extractTextFromElement(obj['t']);
        }

        // Format 3: Check for _ property (text content in xml2js)
        if (obj._ && typeof obj._ === 'string') {
          const trimmed = obj._.trim();
          if (trimmed) {
            texts.push(trimmed);
          }
        }

        // Format 4: Check for $t property (alternative text content)
        if (obj.$t && typeof obj.$t === 'string') {
          const trimmed = obj.$t.trim();
          if (trimmed) {
            texts.push(trimmed);
          }
        }

        // Traverse all properties
        Object.entries(obj).forEach(([key, value]) => {
          // Skip attributes and xmlns
          if (key !== '$' && key !== 'xmlns' && key !== '_' && key !== '$t') {
            traverse(value, depth + 1);
          }
        });
      }
    };

    const extractTextFromElement = (element: any): void => {
      if (typeof element === 'string') {
        const trimmed = element.trim();
        if (trimmed) {
          texts.push(trimmed);
        }
      } else if (Array.isArray(element)) {
        element.forEach(extractTextFromElement);
      } else if (typeof element === 'object') {
        if (element._) {
          const trimmed = element._.trim();
          if (trimmed) {
            texts.push(trimmed);
          }
        } else if (element.$t) {
          const trimmed = element.$t.trim();
          if (trimmed) {
            texts.push(trimmed);
          }
        }
      }
    };

    traverse(parsed);

    console.log(`PPTX: Extracted ${texts.length} text elements`);
    if (texts.length > 0) {
      console.log('PPTX: First few texts:', texts.slice(0, 3));
    }

    // Join texts with spaces and clean up
    const result = texts
      .filter(t => t && t.trim())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return result;
  } catch (error) {
    console.error('Error parsing slide XML:', error);
    return '';
  }
}

/**
 * OPTIONS handler for CORS
 * In development, allows localhost. In production, restricts to same origin only.
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isDevelopment = process.env.NODE_ENV === 'development';

  // In development, allow localhost origins
  const allowedOrigins = isDevelopment
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
    : []; // In production, same-origin only (no CORS header needed)

  const allowedOrigin = allowedOrigins.includes(origin || '') ? origin : null;

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Only add CORS header if origin is allowed
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }

  return new NextResponse(null, {
    status: 200,
    headers,
  });
}
