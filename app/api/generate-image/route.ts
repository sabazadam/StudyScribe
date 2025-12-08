/**
 * API Route: /api/generate-image
 *
 * Generates educational diagrams using Google Imagen 3
 *
 * This endpoint:
 * - Accepts image generation requests with educational context
 * - Uses Google's Imagen 3 API to generate diagrams
 * - Enforces cost controls (max 2 images per material)
 * - Tracks usage and costs
 * - Returns base64-encoded images or URLs
 *
 * NOTE: Imagen 3 pricing is high, so this endpoint has strict limits
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  GenerateImageRequestBody,
  GenerateImageResponseBody,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from '@/lib/types/image';
import { verifyUserAuth } from '@/lib/middleware/authMiddleware';
import { withTimeout, TimeoutError } from '@/lib/utils/timeout';

// ============================================================================
// Configuration
// ============================================================================

// Use the same API key as Gemini (Google AI API)
const GOOGLE_API_KEY = process.env.GEMINI_API_KEY;

// Imagen 4 API endpoint (using Google AI API, same as Gemini)
// Verified working with imagen-4.0-generate-preview-06-06 model
const IMAGEN_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview-06-06:predict';

// Cost per image generation (approximate, in USD)
const COST_PER_IMAGE = 0.04; // Adjust based on actual pricing

// Maximum images per request
const MAX_IMAGES_PER_REQUEST = 1;

// Session-based cost tracking (in-memory, resets on server restart)
const costTracker = {
  totalImagesGenerated: 0,
  totalCostUSD: 0,
  sessionStartedAt: new Date().toISOString(),
};

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  // Verify authentication
  const user = await verifyUserAuth(request);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized. Please sign in to generate images.',
      } as GenerateImageResponseBody,
      { status: 401 }
    );
  }

  try {
    // Import quota and cost tracking (dynamic import to avoid circular deps)
    const { enforceQuotaAndBudget } = await import('@/lib/middleware/quotaMiddleware');
    const { recordCost, getEstimatedCost } = await import('@/lib/firestore/costRepository');
    const { incrementImagesCount } = await import('@/lib/firestore/usageRepository');

    // Check quota and budget BEFORE processing
    try {
      await enforceQuotaAndBudget(user.userId, 'images', true);
    } catch (quotaError: any) {
      console.log(`[GenerateImage] Quota check failed for user ${user.userId}:`, quotaError.message);
      return NextResponse.json(
        {
          success: false,
          error: quotaError.message,
          quotaType: quotaError.quotaType,
          current: quotaError.current,
          limit: quotaError.limit,
          resetAt: quotaError.resetAt,
        } as GenerateImageResponseBody,
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Import validation schema and helpers
    const { generateImageSchema, validateRequestSafe, sanitizeInput } = await import('@/lib/validation');

    // Validate request body
    const validation = validateRequestSafe(generateImageSchema, body);

    if (!validation.success) {
      console.error('[GenerateImage] Validation failed:', validation.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error,
          validationErrors: validation.errors,
        } as GenerateImageResponseBody,
        { status: 400 }
      );
    }

    // Use validated data
    const { request: imageRequest, materialId, proposalId } = validation.data!;

    // Sanitize prompt
    const sanitizedPrompt = sanitizeInput(imageRequest.prompt);
    imageRequest.prompt = sanitizedPrompt;

    // Check API key
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google API key not configured. Please add GOOGLE_API_KEY to your environment variables.',
        } as GenerateImageResponseBody,
        { status: 500 }
      );
    }

    // Enforce image limit per request
    const numberOfImages = Math.min(
      imageRequest.numberOfImages || 1,
      MAX_IMAGES_PER_REQUEST
    );

    // Generate the image
    console.log(`[Imagen 4] Generating image for proposal ${proposalId || 'unknown'}...`);
    console.log(`[Imagen 4] Prompt: ${imageRequest.prompt.substring(0, 100)}...`);

    const imageResponse = await generateImageWithImagen3(imageRequest as any);

    if (!imageResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: imageResponse.error || 'Image generation failed',
        } as GenerateImageResponseBody,
        { status: 500 }
      );
    }

    // Track costs (session tracking - will be replaced by Firestore tracking)
    const cost = COST_PER_IMAGE * numberOfImages;
    costTracker.totalImagesGenerated += numberOfImages;
    costTracker.totalCostUSD += cost;

    console.log(`[Imagen 4] Successfully generated image. Cost: $${cost.toFixed(4)}`);
    console.log(`[Imagen 4] Session total: ${costTracker.totalImagesGenerated} images, $${costTracker.totalCostUSD.toFixed(4)}`);

    // Record usage and cost AFTER successful generation
    try {
      // Increment images count
      await incrementImagesCount(user.userId, numberOfImages);
      console.log(`[GenerateImage] Usage tracked for user ${user.userId}: +${numberOfImages} images`);

      // Record cost
      const estimatedCost = getEstimatedCost('generate-image');
      await recordCost(user.userId, 'generate-image', estimatedCost * numberOfImages);
      console.log(`[GenerateImage] Cost recorded for user ${user.userId}: $${(estimatedCost * numberOfImages).toFixed(4)}`);
    } catch (trackingError) {
      // Log but don't fail the request if tracking fails
      console.error('[GenerateImage] Failed to track usage/cost:', trackingError);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      image: {
        ...imageResponse,
        cost,
      },
      cost,
      remainingQuota: {
        imagesRemaining: Infinity, // No hard limit, but costs are tracked
        budgetRemaining: undefined,
      },
    } as GenerateImageResponseBody);

  } catch (error: any) {
    console.error('[Imagen 4] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      } as GenerateImageResponseBody,
      { status: 500 }
    );
  }
}

// ============================================================================
// Image Generation with Imagen 3
// ============================================================================

/**
 * Generates an image using Google Imagen 3 API
 *
 * @param request - Image generation request
 * @returns Image generation response
 */
async function generateImageWithImagen3(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  try {
    // Build the Imagen 4 request payload
    const payload = buildImagen3Payload(request);

    // Use Google AI API with key parameter (same as Gemini)
    const endpoint = `${IMAGEN_API_ENDPOINT}?key=${GOOGLE_API_KEY}`;

    // Make the API request with 60-second timeout
    let response;
    try {
      response = await withTimeout(
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }),
        60000,
        'Image Generation'
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        console.error('[Generate Image] Request timed out after 60 seconds');
        throw new Error('Image generation timed out. Please try again.');
      }
      throw error; // Re-throw non-timeout errors
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Imagen 4] API Error:', errorText);

      // Try to parse error message
      let errorMessage = 'Imagen 4 API request failed';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        // Use default error message
      }

      // Check if it's an authentication error
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'Authentication failed. Please check your Google Cloud credentials and ensure Imagen 4 API is enabled.';
      }

      return {
        success: false,
        error: errorMessage,
        generatedAt: new Date().toISOString(),
      };
    }

    const data = await response.json();

    // Extract image data from response
    // Note: The exact response format may vary based on Google's API
    // This is a simplified version - adjust based on actual API response
    const imageData = data.predictions?.[0]?.bytesBase64Encoded || data.images?.[0];

    if (!imageData) {
      return {
        success: false,
        error: 'No image data in response',
        generatedAt: new Date().toISOString(),
      };
    }

    return {
      success: true,
      imageData,
      mimeType: 'image/png',
      width: 1024, // Default dimensions, adjust based on actual response
      height: 1024,
      generatedAt: new Date().toISOString(),
    };

  } catch (error: any) {
    console.error('[Imagen 4] Generation error:', error);
    return {
      success: false,
      error: error.message || 'Image generation failed',
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Builds the payload for Imagen 4 API request
 */
function buildImagen3Payload(request: ImageGenerationRequest): any {
  // Imagen 4 API payload structure
  // Using only supported parameters: prompt, sampleCount, aspectRatio, imageSize

  const {
    prompt,
    negativePrompt,
    numberOfImages = 1,
    aspectRatio = '1:1',
  } = request;

  // Convert aspect ratio to dimensions
  const dimensions = getImageDimensions(aspectRatio);

  return {
    instances: [
      {
        prompt, // Only prompt is supported in instances for Imagen 4
      },
    ],
    parameters: {
      sampleCount: numberOfImages,
      aspectRatio, // Use aspectRatio directly instead of width/height
      imageSize: '1K', // 1K or 2K - using 1K for faster generation
    },
  };
}

/**
 * Converts aspect ratio to pixel dimensions
 */
function getImageDimensions(aspectRatio: string): { width: number; height: number } {
  switch (aspectRatio) {
    case '1:1':
      return { width: 1024, height: 1024 };
    case '16:9':
      return { width: 1408, height: 792 };
    case '9:16':
      return { width: 792, height: 1408 };
    case '4:3':
      return { width: 1152, height: 864 };
    case '3:4':
      return { width: 864, height: 1152 };
    default:
      return { width: 1024, height: 1024 };
  }
}

/**
 * Returns default negative prompt for educational images
 */
function getDefaultNegativePrompt(): string {
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
// Cost Tracking Endpoint (Optional)
// ============================================================================

export async function GET(request: NextRequest) {
  // Return current cost tracking stats
  return NextResponse.json({
    ...costTracker,
    costPerImage: COST_PER_IMAGE,
  });
}
