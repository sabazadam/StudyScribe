/**
 * TRANSCRIPTS API
 * ==============================================================================
 * CRUD operations for saved transcripts
 * GET: List or get single transcript
 * POST: Save new transcript
 * PATCH: Update transcript (edit text, rename)
 * DELETE: Delete transcript
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/middleware/authMiddleware';
import {
    saveTranscript,
    getTranscriptById,
    getUserTranscripts,
    updateTranscript,
    deleteTranscript,
    getTranscriptCount,
} from '@/lib/firestore/transcriptRepository';

/**
 * GET /api/transcripts
 * Query params:
 * - id: Get specific transcript
 * - limit: Page size (default 20)
 * - cursor: Pagination cursor
 */
export async function GET(request: NextRequest) {
    const user = await verifyUserAuth(request);
    if (!user) {
        return NextResponse.json(
            { error: 'Please sign in to view transcripts' },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const cursor = searchParams.get('cursor') || undefined;
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

        // Get specific transcript
        if (id) {
            const transcript = await getTranscriptById(id, user.userId);
            if (!transcript) {
                return NextResponse.json(
                    { error: 'Transcript not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json({
                success: true,
                data: { transcript },
            });
        }

        // Get paginated list
        const [listResult, totalCount] = await Promise.all([
            getUserTranscripts(user.userId, limit, cursor),
            cursor ? Promise.resolve(undefined) : getTranscriptCount(user.userId),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                transcripts: listResult.transcripts,
                pagination: {
                    nextCursor: listResult.nextCursor,
                    hasMore: listResult.hasMore,
                    pageSize: limit,
                    totalCount,
                },
            },
        });
    } catch (error: any) {
        console.error('[API Error] transcripts GET:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transcripts', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/transcripts
 * Body: { title, transcript, audioFileName, duration?, language? }
 */
export async function POST(request: NextRequest) {
    const user = await verifyUserAuth(request);
    if (!user) {
        return NextResponse.json(
            { error: 'Please sign in to save transcripts' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { title, transcript, audioFileName, duration, language } = body;

        if (!transcript || !audioFileName) {
            return NextResponse.json(
                { error: 'Missing required fields: transcript, audioFileName' },
                { status: 400 }
            );
        }

        const transcriptId = await saveTranscript(user.userId, {
            title: title || `Transcript - ${audioFileName}`,
            transcript,
            audioFileName,
            duration,
            language,
        });

        return NextResponse.json({
            success: true,
            data: { transcriptId },
            message: 'Transcript saved successfully',
        }, { status: 201 });
    } catch (error: any) {
        console.error('[API Error] transcripts POST:', error);
        return NextResponse.json(
            { error: 'Failed to save transcript', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/transcripts
 * Body: { id, title?, transcript? }
 */
export async function PATCH(request: NextRequest) {
    const user = await verifyUserAuth(request);
    if (!user) {
        return NextResponse.json(
            { error: 'Please sign in to update transcripts' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { id, title, transcript } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Transcript ID is required' },
                { status: 400 }
            );
        }

        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (transcript !== undefined) updates.transcript = transcript;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No updates provided' },
                { status: 400 }
            );
        }

        await updateTranscript(id, user.userId, updates);

        return NextResponse.json({
            success: true,
            message: 'Transcript updated successfully',
        });
    } catch (error: any) {
        console.error('[API Error] transcripts PATCH:', error);
        return NextResponse.json(
            { error: 'Failed to update transcript', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/transcripts?id={transcriptId}
 */
export async function DELETE(request: NextRequest) {
    const user = await verifyUserAuth(request);
    if (!user) {
        return NextResponse.json(
            { error: 'Please sign in to delete transcripts' },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Transcript ID is required' },
                { status: 400 }
            );
        }

        await deleteTranscript(id, user.userId);

        return NextResponse.json({
            success: true,
            message: 'Transcript deleted successfully',
        });
    } catch (error: any) {
        console.error('[API Error] transcripts DELETE:', error);
        return NextResponse.json(
            { error: 'Failed to delete transcript', details: error.message },
            { status: 500 }
        );
    }
}
