import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ==============================================================================
// RATE LIMITING & COST CONTROL MIDDLEWARE
// ==============================================================================
// Protects expensive AI API endpoints from abuse and runaway costs
// Now uses USER-BASED rate limiting instead of IP-based
// ==============================================================================
//
// NOTE: This middleware runs on Edge runtime and CANNOT use Firebase Admin SDK
// User authentication is verified in individual API routes using authMiddleware.ts
// This middleware only does basic rate limiting by IP for now
// ==============================================================================

// ==============================================================================
// SUBSCRIPTION TIER CONFIGURATION
// ==============================================================================

interface TierLimits {
  materials: number;
  images: number;
  transcribe: number;
  extractSlides: number;
  default: number;
}

const TIER_RATE_LIMITS: Record<string, TierLimits> = {
  free: {
    materials: 10,        // 10 requests per 15min
    images: 5,            // 5 requests per 15min
    transcribe: 5,        // 5 requests per 15min
    extractSlides: 15,    // 15 requests per 15min
    default: 30,          // 30 requests per 15min
  },
  student: {
    materials: 20,        // 20 requests per 15min
    images: 10,           // 10 requests per 15min
    transcribe: 10,       // 10 requests per 15min
    extractSlides: 30,    // 30 requests per 15min
    default: 50,          // 50 requests per 15min
  },
  premium: {
    materials: 50,        // 50 requests per 15min
    images: 30,           // 30 requests per 15min
    transcribe: 25,       // 25 requests per 15min
    extractSlides: 100,   // 100 requests per 15min
    default: 100,         // 100 requests per 15min
  },
};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Daily budget configuration
const DAILY_BUDGET_USD = 50; // Maximum spend per day across all users

// ==============================================================================
// IN-MEMORY RATE LIMIT STORAGE
// ==============================================================================
// User-based rate limiting: Map<userId, Map<endpoint, { count, windowStart }>>
// For production, migrate to Redis/Upstash/Vercel KV for persistence

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const userRateLimits = new Map<string, Map<string, RateLimitEntry>>();

// Fallback IP-based rate limiting for unauthenticated requests
const ipRateLimits = new Map<string, Map<string, RateLimitEntry>>();

// ==============================================================================
// MIDDLEWARE FUNCTION
// ==============================================================================

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip rate limiting for certain endpoints
  if (
    pathname.startsWith('/api/admin/') ||
    pathname === '/api/auth/verify' ||
    pathname === '/api/health'
  ) {
    return NextResponse.next();
  }

  try {
    // Get rate limit key (IP-based for now)
    // Note: User-based quotas are enforced in API routes via quotaMiddleware
    const rateLimitKey = getRateLimitKey(request);

    // Determine rate limit based on endpoint
    const endpointKey = getEndpointKey(pathname);
    const rateLimit = getRateLimitForTier('free', endpointKey); // Use free tier limits for middleware

    // Check rate limit
    const rateLimitResult = checkUserRateLimit(
      rateLimitKey,
      pathname,
      rateLimit,
      false // Not authenticated at middleware level
    );

    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
          limit: rateLimit,
          resetAt: new Date(rateLimitResult.resetTime).toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter.toString(),
            'X-RateLimit-Limit': rateLimit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // Note: User-based quotas and budget checking are handled in API routes using quotaMiddleware
    // This allows for more accurate cost tracking after successful operations

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', rateLimit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    return response;
  } catch (error) {
    console.error('[Middleware] Error processing request:', error);
    // Allow request to proceed on middleware error
    return NextResponse.next();
  }
}

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

/**
 * Get a simple identifier for rate limiting
 * Uses IP address since middleware cannot use Firebase Admin SDK (Edge runtime)
 * Actual user authentication and quota enforcement happens in API routes
 */
function getRateLimitKey(request: NextRequest): string {
  const clientIp = getClientIp(request);
  return `ip:${clientIp}`;
}

/**
 * Get client IP address
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown-client';
}

/**
 * Map pathname to endpoint key
 */
function getEndpointKey(pathname: string): keyof TierLimits {
  if (pathname.includes('generate-materials')) return 'materials';
  if (pathname.includes('generate-image')) return 'images';
  if (pathname.includes('transcribe')) return 'transcribe';
  if (pathname.includes('extract-slides')) return 'extractSlides';
  return 'default';
}

/**
 * Get rate limit for tier and endpoint
 */
function getRateLimitForTier(
  tier: 'free' | 'student' | 'premium',
  endpointKey: keyof TierLimits
): number {
  return TIER_RATE_LIMITS[tier][endpointKey];
}

/**
 * Check user-based rate limit
 */
function checkUserRateLimit(
  userId: string,
  endpoint: string,
  limit: number,
  isAuthenticated: boolean
): { allowed: boolean; remaining: number; retryAfter: number; resetTime: number } {
  const now = Date.now();

  // Choose storage based on authentication status
  const storage = isAuthenticated ? userRateLimits : ipRateLimits;

  // Get or initialize user's rate limit map
  if (!storage.has(userId)) {
    storage.set(userId, new Map());
  }

  const userLimits = storage.get(userId)!;

  // Get or initialize endpoint rate limit entry
  let entry = userLimits.get(endpoint);

  if (!entry) {
    entry = { count: 0, windowStart: now };
    userLimits.set(endpoint, entry);
  }

  // Reset if window has expired
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    const resetTime = entry.windowStart + RATE_LIMIT_WINDOW_MS;
    const retryAfter = Math.ceil((resetTime - now) / 1000); // seconds

    return {
      allowed: false,
      remaining: 0,
      retryAfter,
      resetTime,
    };
  }

  // Increment count
  entry.count++;

  return {
    allowed: true,
    remaining: limit - entry.count,
    retryAfter: 0,
    resetTime: entry.windowStart + RATE_LIMIT_WINDOW_MS,
  };
}

// ==============================================================================
// MIDDLEWARE MATCHER
// ==============================================================================
// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
};

// ==============================================================================
// NOTE: Budget tracking is now handled in costRepository.ts
// Use recordCost() and getGlobalDailyCost() for cost tracking
// ==============================================================================
