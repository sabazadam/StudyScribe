/**
 * Standalone PDF text extraction test
 * Tests PDF extraction locally before integrating into the project
 */

const fs = require('fs');
const path = require('path');

// Simple PDF text extractor using only Node.js built-ins
// This extracts text by parsing PDF structure directly
async function extractPDFTextSimple(pdfPath) {
  try {
    console.log('\n=== Starting PDF Text Extraction Test ===');
    console.log('PDF File:', pdfPath);

    // Read the PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log('File size:', pdfBuffer.length, 'bytes');

    // Convert buffer to string for simple text extraction
    // PDFs store text in streams between 'stream' and 'endstream' markers
    const pdfText = pdfBuffer.toString('latin1');

    // Extract text content using regex patterns
    // Look for text between BT (Begin Text) and ET (End Text) operators
    const textMatches = pdfText.match(/BT(.*?)ET/gs) || [];
    console.log('Found', textMatches.length, 'text blocks');

    let extractedText = '';

    for (const block of textMatches) {
      // Extract strings within parentheses or angle brackets
      // Tj and TJ are PDF text-showing operators
      const strings = block.match(/\((.*?)\)/g) || [];

      for (const str of strings) {
        // Remove parentheses and clean up
        const cleaned = str
          .substring(1, str.length - 1)
          .replace(/\\r/g, '\n')
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');

        extractedText += cleaned + ' ';
      }
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .trim();

    console.log('\n=== Extraction Results ===');
    console.log('Extracted text length:', extractedText.length, 'characters');
    console.log('Word count:', extractedText.split(/\s+/).length);

    if (extractedText.length > 0) {
      console.log('\n=== First 500 characters ===');
      console.log(extractedText.substring(0, 500));
      console.log('\n✅ SUCCESS: PDF text extracted successfully!');
    } else {
      console.log('\n⚠️  WARNING: No text extracted (might be image-based PDF)');
    }

    return extractedText;

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return '';
  }
}

// Test with a PDF file
// Usage: node test-pdf-local.js <path-to-pdf>
const pdfPath = process.argv[2] || './public/study-materials/test.pdf';

if (!fs.existsSync(pdfPath)) {
  console.error('Error: PDF file not found:', pdfPath);
  console.log('\nUsage: node test-pdf-local.js <path-to-pdf-file>');
  process.exit(1);
}

extractPDFTextSimple(pdfPath)
  .then(() => {
    console.log('\n=== Test Complete ===\n');
  })
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
