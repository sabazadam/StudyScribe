import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

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

        if (fileType === 'pdf') {
          console.log('Extracting PDF...');
          extractedText = await extractPDFText(file);
          console.log('PDF extracted, text length:', extractedText.length);

          if (!extractedText || extractedText.trim().length === 0) {
            console.warn(`PDF ${fileName} returned empty text - may need vision AI fallback`);
          }
        } else if (fileType === 'pptx') {
          console.log('Extracting PPTX...');
          extractedText = await extractPPTXText(file);
          console.log('PPTX extracted, text length:', extractedText.length);

          if (!extractedText || extractedText.trim().length === 0) {
            console.warn(`PPTX ${fileName} returned empty text - may need vision AI fallback`);
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
          // Add a warning if extraction resulted in very little text
          ...(wordCount < 20 ? { warning: 'Low word count - may benefit from vision AI processing' } : {})
        });
      } catch (error: any) {
        console.error(`Error extracting ${fileName}:`, error);
        console.error('Error stack:', error.stack);
        results.push({
          fileName,
          type: fileType,
          text: '',
          error: error.message || 'Extraction failed',
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
 * Extract text from PDF file using pdf-parse 1.1.1
 */
async function extractPDFText(file: File): Promise<string> {
  try {
    console.log('extractPDFText: Starting PDF extraction');

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('extractPDFText: Buffer created, size:', buffer.length);

    // Load pdf-parse using require (CommonJS)
    // pdf-parse 1.1.1 is a simple CommonJS module that exports a function directly
    const pdfParse = require('pdf-parse');
    console.log('extractPDFText: pdf-parse loaded, type:', typeof pdfParse);

    // Parse PDF - pdf-parse 1.1.1 is called directly as a function
    console.log('extractPDFText: Parsing PDF...');
    const data = await pdfParse(buffer);

    console.log('extractPDFText: PDF parsed successfully!');
    console.log('extractPDFText: Pages:', data.numpages);
    console.log('extractPDFText: Text length:', data.text ? data.text.length : 0);

    if (!data || !data.text) {
      console.warn('extractPDFText: No text found in PDF');
      return '';
    }

    // Extract and clean text
    let text = data.text;

    if (!text || text.trim().length === 0) {
      console.warn('extractPDFText: PDF text is empty after extraction');
      return '';
    }

    // Clean up the text
    text = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
      .trim();

    console.log('extractPDFText: Final text length:', text.length);
    console.log('extractPDFText: Word count:', text.split(/\s+/).length);

    return text;
  } catch (error: any) {
    console.error('extractPDFText: Error occurred');
    console.error('extractPDFText: Error message:', error.message);
    console.error('extractPDFText: Error stack:', error.stack);

    // Return empty string instead of throwing to allow fallback to vision AI
    console.warn('extractPDFText: Returning empty string due to error');
    return '';
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
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
