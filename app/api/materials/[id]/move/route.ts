/**
 * MATERIAL MOVE API
 * ==============================================================================
 * POST /api/materials/[id]/move - Move material to a different folder
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { verifyUserAuth } from '@/lib/middleware/authMiddleware';
import { moveMaterialToFolder } from '@/lib/firestore/folderRepository';
import { getMaterialById } from '@/lib/firestore/materialRepository';

type RouteContext = {
  params: {
    id: string;
  };
};

/**
 * POST /api/materials/[id]/move
 * Move a material to a different folder
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: `POST /api/materials/${params.id}/move`,
    },
    async (span) => {
      try {
        span.setAttribute('materialId', params.id);

        // Verify authentication
        const user = await verifyUserAuth(request);
        if (!user) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        const userId = user.userId;
        const materialId = params.id;

        // Parse request body
        const body = await request.json();
        const { folderId } = body;

        // Validate: folderId can be null (move to root) or a string
        if (folderId !== null && typeof folderId !== 'string') {
          return NextResponse.json(
            { error: 'Invalid folderId' },
            { status: 400 }
          );
        }

        // Verify material ownership
        const material = await getMaterialById(materialId, userId);
        if (!material) {
          return NextResponse.json(
            { error: 'Material not found' },
            { status: 404 }
          );
        }

        span.setAttribute('targetFolderId', folderId || 'root');

        // Move material to folder
        await moveMaterialToFolder(materialId, folderId, userId);

        return NextResponse.json({
          success: true,
          message: 'Material moved successfully',
          materialId,
          folderId,
        });
      } catch (error) {
        console.error(`[POST /api/materials/${params.id}/move] Error:`, error);
        Sentry.captureException(error, {
          tags: {
            endpoint: `/api/materials/${params.id}/move`,
            method: 'POST',
            materialId: params.id,
          },
        });

        return NextResponse.json(
          {
            error: 'Failed to move material',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }
  );
}
