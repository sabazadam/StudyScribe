import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { getModelById, type ModelTier } from '@/lib/models';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * API endpoint to analyze lecture photos using Gemini Vision
 * Extracts text, identifies diagrams, formulas, and visual elements
 * Accepts images as base64 encoded data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, modelTier } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided. Expected array of {data: base64, mimeType: string}' },
        { status: 400 }
      );
    }

    console.log(`Analyzing ${images.length} images with Gemini Vision...`);

    // Get the appropriate model based on user selection
    const selectedModel = getModelById((modelTier as ModelTier) || 'default');
    console.log('Using model:', selectedModel, 'for image analysis');
    const model = genAI.getGenerativeModel({ model: selectedModel });

    const results = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      if (!image.data || !image.mimeType) {
        results.push({
          index: i,
          fileName: image.fileName || `Image ${i + 1}`,
          error: 'Invalid image format. Need data and mimeType fields.'
        });
        continue;
      }

      try {
        // Create prompt for comprehensive image analysis
        const prompt = `You are analyzing a lecture photo. This could be a whiteboard, handwritten notes, a diagram, a formula, or any visual material from a class.

Please provide a comprehensive analysis:

1. **Content Type**: What is this image? (whiteboard, handwritten notes, printed slide photo, diagram, formula, chart, etc.)

2. **Text Content**: Extract ALL visible text exactly as written, preserving:
   - Mathematical formulas and equations
   - Bullet points and lists
   - Headers and titles
   - Any handwritten or printed text

3. **Visual Elements**: Describe any:
   - Diagrams, charts, or graphs
   - Arrows, connections, or relationships shown
   - Drawings or illustrations
   - Tables or structured data

4. **Key Concepts**: What are the main concepts or topics being taught?

5. **Context**: How might this fit into a lecture? What subject area does this appear to be from?

Format your response in clear sections with markdown. Be thorough and precise, especially with formulas and technical content.`;

        const imagePart = {
          inlineData: {
            data: image.data,
            mimeType: image.mimeType
          }
        };

        console.log(`Processing image ${i + 1}/${images.length}...`);
        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response;
        const analysis = response.text();

        results.push({
          index: i,
          fileName: image.fileName || `Image ${i + 1}`,
          analysis,
          success: true
        });

        console.log(`✓ Image ${i + 1} analyzed successfully`);
      } catch (error: any) {
        console.error(`Error analyzing image ${i + 1}:`, error);
        results.push({
          index: i,
          fileName: image.fileName || `Image ${i + 1}`,
          error: error.message || 'Analysis failed',
          success: false
        });
      }
    }

    // Combine all analyses into a structured format
    const combinedAnalysis = results
      .filter(r => r.success && r.analysis)
      .map(r => `### ${r.fileName}\n\n${r.analysis || ''}`)
      .join('\n\n---\n\n');

    // Extract just the text content for easier processing
    const extractedText = results
      .filter(r => r.success && r.analysis)
      .map(r => {
        // Try to extract the "Text Content" section
        const match = r.analysis?.match(/\*\*Text Content\*\*:?\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
        if (match) return match[1].trim();
        return r.analysis || ''; // Fallback to full analysis
      })
      .join('\n\n');

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      results,
      combinedAnalysis,
      extractedText,
      stats: {
        total: images.length,
        successful: successCount,
        failed: images.length - successCount
      }
    });

  } catch (error: any) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze images' },
      { status: 500 }
    );
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
