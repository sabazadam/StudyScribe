/**
 * FOLDERS API - Individual Folder Operations
 * ==============================================================================
 * GET    /api/folders/[id] - Get folder by ID
 * PUT    /api/folders/[id] - Update folder
 * DELETE /api/folders/[id] - Delete folder
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { verifyUserAuth } from '@/lib/middleware/authMiddleware';
import {
  getFolderById,
  updateFolder,
  deleteFolder,
} from '@/lib/firestore/folderRepository';

type RouteContext = {
  params: {
    id: string;
  };
};

/**
 * GET /api/folders/[id]
 * Get a specific folder by ID
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: `GET /api/folders/${params.id}`,
    },
    async (span) => {
      try {
        span.setAttribute('folderId', params.id);

        // Verify authentication
        const user = await verifyUserAuth(request);
        if (!user) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        const userId = user.userId;
        const folderId = params.id;

        // Get folder
        const folder = await getFolderById(folderId, userId);

        if (!folder) {
          return NextResponse.json(
            { error: 'Folder not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          folder,
        });
      } catch (error) {
        console.error(`[GET /api/folders/${params.id}] Error:`, error);
        Sentry.captureException(error, {
          tags: {
            endpoint: `/api/folders/${params.id}`,
            method: 'GET',
            folderId: params.id,
          },
        });

        return NextResponse.json(
          {
            error: 'Failed to fetch folder',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * PUT /api/folders/[id]
 * Update a folder
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: `PUT /api/folders/${params.id}`,
    },
    async (span) => {
      try {
        span.setAttribute('folderId', params.id);

        // Verify authentication
        const user = await verifyUserAuth(request);
        if (!user) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        const userId = user.userId;
        const folderId = params.id;

        // Parse request body
        const body = await request.json();
        const { name, color, emoji } = body;

        // Validate updates
        const updates: any = {};

        if (name !== undefined) {
          if (typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
              { error: 'Invalid folder name' },
              { status: 400 }
            );
          }
          if (name.length > 100) {
            return NextResponse.json(
              { error: 'Folder name must be 100 characters or less' },
              { status: 400 }
            );
          }
          updates.name = name.trim();
        }

        if (color !== undefined) {
          updates.color = color;
        }

        if (emoji !== undefined) {
          updates.emoji = emoji;
        }

        // Update folder
        const updatedFolder = await updateFolder(folderId, userId, updates);

        return NextResponse.json({
          success: true,
          folder: updatedFolder,
        });
      } catch (error) {
        console.error(`[PUT /api/folders/${params.id}] Error:`, error);
        Sentry.captureException(error, {
          tags: {
            endpoint: `/api/folders/${params.id}`,
            method: 'PUT',
            folderId: params.id,
          },
        });

        return NextResponse.json(
          {
            error: 'Failed to update folder',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * DELETE /api/folders/[id]
 * Delete a folder and optionally its materials
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: `DELETE /api/folders/${params.id}`,
    },
    async (span) => {
      try {
        span.setAttribute('folderId', params.id);

        // Verify authentication
        const user = await verifyUserAuth(request);
        if (!user) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        const userId = user.userId;
        const folderId = params.id;

        // Get optional deleteMaterials flag from query params
        const { searchParams } = new URL(request.url);
        const deleteMaterials = searchParams.get('deleteMaterials') !== 'false';

        // Delete folder
        await deleteFolder(folderId, userId, deleteMaterials);

        return NextResponse.json({
          success: true,
          message: 'Folder deleted successfully',
          deletedMaterials: deleteMaterials,
        });
      } catch (error) {
        console.error(`[DELETE /api/folders/${params.id}] Error:`, error);
        Sentry.captureException(error, {
          tags: {
            endpoint: `/api/folders/${params.id}`,
            method: 'DELETE',
            folderId: params.id,
          },
        });

        return NextResponse.json(
          {
            error: 'Failed to delete folder',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }
  );
}
