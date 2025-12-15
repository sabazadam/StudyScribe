/**
 * Study Materials API Routes
 * GET: Retrieve user's study materials
 * POST: Create new study material (usually called by generate-materials)
 * PATCH: Update existing material
 * DELETE: Delete material
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/middleware/authMiddleware';
import {
  getUserMaterials,
  getMaterialById,
  getUserMaterialsByType,
  updateMaterial,
  deleteMaterial,
  searchMaterials,
  saveMaterial,
  getMaterialsList,
  getMaterialsCount,
} from '@/lib/firestore/materialRepository';
import { MaterialType } from '@/lib/types/firestore';
import {
  ErrorCode,
  createAuthError,
  createNotFoundError,
  createMissingFieldError,
  createValidationError,
  createInternalError,
  ApiError,
} from '@/lib/api/errorHandler';

/**
 * GET /api/study-materials
 * Query params:
 * - id: Get specific material by ID
 * - type: Filter by material type
 * - search: Search materials by title or content
 * - mode: 'list' for lightweight paginated list (recommended for Study Hub)
 * - limit: Number of items per page (default 8, max 50)
 * - cursor: Document ID for pagination
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const user = await verifyUserAuth(request);
  if (!user) {
    return createAuthError('Please sign in to view your study materials.');
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const mode = searchParams.get('mode');
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 50);

    // Get specific material by ID (full content)
    if (id) {
      const material = await getMaterialById(id, user.userId);

      if (!material) {
        return createNotFoundError('Study material');
      }

      return NextResponse.json({
        success: true,
        data: { material },
        timestamp: new Date().toISOString(),
      });
    }

    // NEW: Lightweight paginated list mode (optimized for Study Hub)
    if (mode === 'list') {
      const [listResult, totalCount] = await Promise.all([
        getMaterialsList(user.userId, limit, cursor),
        cursor ? Promise.resolve(undefined) : getMaterialsCount(user.userId), // Only count on first page
      ]);

      return NextResponse.json({
        success: true,
        data: {
          materials: listResult.materials,
          pagination: {
            nextCursor: listResult.nextCursor,
            hasMore: listResult.hasMore,
            pageSize: limit,
            totalCount: totalCount,
          }
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Search materials (full content needed for search)
    if (search) {
      const materials = await searchMaterials(user.userId, search);
      return NextResponse.json({
        success: true,
        data: { materials, count: materials.length },
        timestamp: new Date().toISOString(),
      });
    }

    // Get materials by type (legacy - full content)
    if (type) {
      const materials = await getUserMaterialsByType(
        user.userId,
        type as MaterialType,
        50
      );
      return NextResponse.json({
        success: true,
        data: { materials, count: materials.length },
        timestamp: new Date().toISOString(),
      });
    }

    // Get all materials (legacy - full content, for backward compatibility)
    const materials = await getUserMaterials(user.userId, 50);
    return NextResponse.json({
      success: true,
      data: { materials, count: materials.length },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[API Error] study-materials GET:', error);
    return createInternalError(error, 'GET /api/study-materials');
  }
}

/**
 * POST /api/study-materials
 * Save new study material
 * Note: Usually materials are created via /api/generate-materials
 * This endpoint allows manual creation or import
 */
export async function POST(request: NextRequest) {
  // Verify authentication
  const user = await verifyUserAuth(request);
  if (!user) {
    return createAuthError('Please sign in to create study materials.');
  }

  try {
    const body = await request.json();

    // Import validation schema and helpers
    const { createMaterialSchema, validateRequestSafe, sanitizeInput, sanitizeStringArray } = await import('@/lib/validation');

    // Validate request body
    const validation = validateRequestSafe(createMaterialSchema, body);

    if (!validation.success) {
      console.error('[CreateMaterial] Validation failed:', validation.error);
      return createValidationError(
        'request',
        validation.error || 'Invalid material data',
        validation.errors?.join(', ')
      );
    }

    // Use validated data
    const {
      title,
      materialType,
      content,
      sources,
      imageData,
      tags,
      folderId
    } = validation.data!;

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedTags = tags ? sanitizeStringArray(tags) : [];

    // Get folder path if folderId is provided
    let folderPath: string[] = [];
    if (folderId) {
      const { getFolderById } = await import('@/lib/firestore/folderRepository');
      const folder = await getFolderById(folderId, user.userId);
      if (folder) {
        folderPath = folder.path;
      }
    }

    // Save material with sanitized data
    const materialId = await saveMaterial(user.userId, {
      title: sanitizedTitle,
      materialType,
      content, // Content can be large, skip sanitization (it's generated by our own AI)
      sources: sources || {},
      imageData: imageData || undefined,
      tags: sanitizedTags,
      folderId: folderId || null,
      folderPath
    });

    return NextResponse.json({
      success: true,
      data: { materialId },
      message: 'Material saved successfully',
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API Error] study-materials POST:', error);
    return createInternalError(error, 'POST /api/study-materials');
  }
}

/**
 * PATCH /api/study-materials
 * Update existing material
 */
export async function PATCH(request: NextRequest) {
  // Verify authentication
  const user = await verifyUserAuth(request);
  if (!user) {
    return createAuthError('Please sign in to update study materials.');
  }

  try {
    const body = await request.json();

    // Import validation schema and helpers
    const { updateMaterialSchema, validateRequestSafe, sanitizeInput, sanitizeStringArray } = await import('@/lib/validation');

    // Validate request body
    const validation = validateRequestSafe(updateMaterialSchema, body);

    if (!validation.success) {
      console.error('[UpdateMaterial] Validation failed:', validation.error);
      return createValidationError(
        'request',
        validation.error || 'Invalid update data',
        validation.errors?.join(', ')
      );
    }

    // Use validated data
    const { id, ...updates } = validation.data!;

    // Sanitize updates
    const allowedUpdates: any = {};
    if (updates.title !== undefined) allowedUpdates.title = sanitizeInput(updates.title);
    if (updates.content !== undefined) allowedUpdates.content = updates.content; // Skip sanitization for large content
    if (updates.tags !== undefined) allowedUpdates.tags = sanitizeStringArray(updates.tags);
    if (updates.imageData !== undefined) allowedUpdates.imageData = updates.imageData;

    await updateMaterial(id, user.userId, allowedUpdates);

    return NextResponse.json({
      success: true,
      message: 'Material updated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[API Error] study-materials PATCH:', error);
    return createInternalError(error, 'PATCH /api/study-materials');
  }
}

/**
 * DELETE /api/study-materials?id={materialId}
 * Remove material
 */
export async function DELETE(request: NextRequest) {
  // Verify authentication
  const user = await verifyUserAuth(request);
  if (!user) {
    return createAuthError('Please sign in to delete study materials.');
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return createMissingFieldError(['id']);
    }

    await deleteMaterial(id, user.userId);

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[API Error] study-materials DELETE:', error);
    return createInternalError(error, 'DELETE /api/study-materials');
  }
}
