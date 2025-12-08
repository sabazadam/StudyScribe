/**
 * FOLDERS API - List & Create
 * ==============================================================================
 * GET  /api/folders - List all folders for authenticated user
 * POST /api/folders - Create a new folder
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { verifyUserAuth } from '@/lib/middleware/authMiddleware';
import {
  createFolder,
  getUserFolders,
  getFoldersByParent,
} from '@/lib/firestore/folderRepository';

/**
 * GET /api/folders
 * List all folders for the authenticated user
 */
export async function GET(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'GET /api/folders',
    },
    async () => {
      try {
        // Verify authentication
        const user = await verifyUserAuth(request);
        if (!user) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        const userId = user.userId;

        // Get optional parent filter
        const { searchParams } = new URL(request.url);
        const parentId = searchParams.get('parentId');

        let folders;
        if (parentId !== null) {
          // Get folders by parent (null for root folders)
          folders = await getFoldersByParent(
            userId,
            parentId === 'null' ? null : parentId
          );
        } else {
          // Get all folders
          folders = await getUserFolders(userId);
        }

        return NextResponse.json({
          success: true,
          folders,
          count: folders.length,
        });
      } catch (error) {
        console.error('[GET /api/folders] Error:', error);
        Sentry.captureException(error, {
          tags: { endpoint: '/api/folders', method: 'GET' },
        });

        return NextResponse.json(
          {
            error: 'Failed to fetch folders',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * POST /api/folders
 * Create a new folder
 */
export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'POST /api/folders',
    },
    async () => {
      try {
        // Verify authentication
        const user = await verifyUserAuth(request);
        if (!user) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        const userId = user.userId;

        // Parse request body
        const body = await request.json();
        const { name, parentFolderId, color, emoji } = body;

        // Validate required fields
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          return NextResponse.json(
            { error: 'Folder name is required' },
            { status: 400 }
          );
        }

        // Validate name length
        if (name.length > 100) {
          return NextResponse.json(
            { error: 'Folder name must be 100 characters or less' },
            { status: 400 }
          );
        }

        // Create folder
        const folder = await createFolder(
          userId,
          name.trim(),
          parentFolderId || null,
          {
            color,
            emoji,
          }
        );

        return NextResponse.json({
          success: true,
          folder,
        });
      } catch (error) {
        console.error('[POST /api/folders] Error:', error);
        Sentry.captureException(error, {
          tags: { endpoint: '/api/folders', method: 'POST' },
        });

        return NextResponse.json(
          {
            error: 'Failed to create folder',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }
  );
}
