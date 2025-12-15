/**
 * TRANSCRIPT REPOSITORY
 * ==============================================================================
 * Firestore repository for audio transcripts
 * Supports: save, get, list, update, delete, link to materials
 * ==============================================================================
 */

import { adminDb } from '@/lib/firebase/adminConfig';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
    TranscriptDocument,
    Transcript,
    TranscriptListItem,
    CreateTranscriptInput,
    transcriptDocumentToTranscript,
} from '@/lib/types/firestore';


const TRANSCRIPTS_COLLECTION = 'transcripts';

/**
 * Save a new transcript
 */
export async function saveTranscript(
    userId: string,
    input: CreateTranscriptInput
): Promise<string> {
    try {
        if (!userId) {
            throw new Error('userId is required to save transcript');
        }

        const transcriptsRef = adminDb.collection(TRANSCRIPTS_COLLECTION);

        const docData = {
            userId,
            title: input.title,
            transcript: input.transcript,
            audioFileName: input.audioFileName,
            duration: input.duration || null,
            wordCount: input.transcript.split(/\s+/).length,
            language: input.language || 'en',
            linkedMaterialIds: [],
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        const docRef = await transcriptsRef.add(docData);
        console.log('[transcriptRepository] Transcript saved:', docRef.id);
        return docRef.id;
    } catch (error: any) {
        console.error('[transcriptRepository] Error saving transcript:', error);
        throw new Error(`Failed to save transcript: ${error.message}`);
    }
}

/**
 * Get a transcript by ID (with ownership check)
 */
export async function getTranscriptById(
    transcriptId: string,
    userId: string
): Promise<Transcript | null> {
    try {
        const docRef = adminDb.collection(TRANSCRIPTS_COLLECTION).doc(transcriptId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        const data = doc.data();
        if (data?.userId !== userId) {
            return null; // Access denied
        }

        const transcriptDoc: TranscriptDocument = {
            id: doc.id,
            userId: data.userId,
            title: data.title,
            transcript: data.transcript,
            audioFileName: data.audioFileName,
            duration: data.duration,
            wordCount: data.wordCount,
            language: data.language,
            linkedMaterialIds: data.linkedMaterialIds || [],
            createdAt: data.createdAt as Timestamp,
            updatedAt: data.updatedAt as Timestamp,
        };

        return transcriptDocumentToTranscript(transcriptDoc);
    } catch (error: any) {
        console.error('[transcriptRepository] Error getting transcript:', error);
        throw new Error(`Failed to get transcript: ${error.message}`);
    }
}

/**
 * Get paginated list of user's transcripts (lightweight)
 */
export async function getUserTranscripts(
    userId: string,
    pageSize: number = 20,
    cursor?: string
): Promise<{ transcripts: TranscriptListItem[]; nextCursor?: string; hasMore: boolean }> {
    try {
        if (!userId) {
            throw new Error('userId is required');
        }

        const transcriptsRef = adminDb.collection(TRANSCRIPTS_COLLECTION);

        let query = transcriptsRef
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(pageSize + 1);

        if (cursor) {
            const cursorDoc = await transcriptsRef.doc(cursor).get();
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc);
            }
        }

        const snapshot = await query.get();
        const docs = snapshot.docs;

        const hasMore = docs.length > pageSize;
        const docsToReturn = hasMore ? docs.slice(0, pageSize) : docs;

        const transcripts: TranscriptListItem[] = docsToReturn.map((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;

            return {
                id: doc.id,
                title: data.title,
                audioFileName: data.audioFileName,
                duration: data.duration,
                wordCount: data.wordCount,
                linkedMaterialCount: (data.linkedMaterialIds || []).length,
                createdAt: createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
        });

        const lastDoc = docsToReturn[docsToReturn.length - 1];
        const nextCursor = hasMore && lastDoc ? lastDoc.id : undefined;

        console.log(`[transcriptRepository] Fetched ${transcripts.length} transcripts`);

        return { transcripts, nextCursor, hasMore };
    } catch (error: any) {
        console.error('[transcriptRepository] Error getting transcripts:', error);
        throw new Error(`Failed to get transcripts: ${error.message}`);
    }
}

/**
 * Update a transcript
 */
export async function updateTranscript(
    transcriptId: string,
    userId: string,
    updates: Partial<{ title: string; transcript: string }>
): Promise<void> {
    try {
        const transcriptRef = adminDb.collection(TRANSCRIPTS_COLLECTION).doc(transcriptId);
        const doc = await transcriptRef.get();

        if (!doc.exists) {
            throw new Error('Transcript not found');
        }

        if (doc.data()?.userId !== userId) {
            throw new Error('Access denied');
        }

        const updateData: any = {
            ...updates,
            updatedAt: Timestamp.now(),
        };

        // Recalculate word count if transcript text changed
        if (updates.transcript) {
            updateData.wordCount = updates.transcript.split(/\s+/).length;
        }

        await transcriptRef.update(updateData);
        console.log('[transcriptRepository] Transcript updated:', transcriptId);
    } catch (error: any) {
        console.error('[transcriptRepository] Error updating transcript:', error);
        throw new Error(`Failed to update transcript: ${error.message}`);
    }
}

/**
 * Link a transcript to a material
 */
export async function linkTranscriptToMaterial(
    transcriptId: string,
    materialId: string,
    userId: string
): Promise<void> {
    try {
        const transcriptRef = adminDb.collection(TRANSCRIPTS_COLLECTION).doc(transcriptId);
        const doc = await transcriptRef.get();

        if (!doc.exists) {
            throw new Error('Transcript not found');
        }

        if (doc.data()?.userId !== userId) {
            throw new Error('Access denied');
        }

        await transcriptRef.update({
            linkedMaterialIds: FieldValue.arrayUnion(materialId),
            updatedAt: Timestamp.now(),
        });

        console.log(`[transcriptRepository] Linked transcript ${transcriptId} to material ${materialId}`);
    } catch (error: any) {
        console.error('[transcriptRepository] Error linking transcript:', error);
        throw new Error(`Failed to link transcript: ${error.message}`);
    }
}

/**
 * Unlink a transcript from a material
 */
export async function unlinkTranscriptFromMaterial(
    transcriptId: string,
    materialId: string,
    userId: string
): Promise<void> {
    try {
        const transcriptRef = adminDb.collection(TRANSCRIPTS_COLLECTION).doc(transcriptId);
        const doc = await transcriptRef.get();

        if (!doc.exists) {
            throw new Error('Transcript not found');
        }

        if (doc.data()?.userId !== userId) {
            throw new Error('Access denied');
        }

        await transcriptRef.update({
            linkedMaterialIds: FieldValue.arrayRemove(materialId),
            updatedAt: Timestamp.now(),
        });

        console.log(`[transcriptRepository] Unlinked transcript ${transcriptId} from material ${materialId}`);
    } catch (error: any) {
        console.error('[transcriptRepository] Error unlinking transcript:', error);
        throw new Error(`Failed to unlink transcript: ${error.message}`);
    }
}

/**
 * Delete a transcript
 */
export async function deleteTranscript(
    transcriptId: string,
    userId: string
): Promise<void> {
    try {
        const transcriptRef = adminDb.collection(TRANSCRIPTS_COLLECTION).doc(transcriptId);
        const doc = await transcriptRef.get();

        if (!doc.exists) {
            throw new Error('Transcript not found');
        }

        if (doc.data()?.userId !== userId) {
            throw new Error('Access denied');
        }

        await transcriptRef.delete();
        console.log('[transcriptRepository] Transcript deleted:', transcriptId);
    } catch (error: any) {
        console.error('[transcriptRepository] Error deleting transcript:', error);
        throw new Error(`Failed to delete transcript: ${error.message}`);
    }
}

/**
 * Get transcript count for a user
 */
export async function getTranscriptCount(userId: string): Promise<number> {
    try {
        const snapshot = await adminDb.collection(TRANSCRIPTS_COLLECTION)
            .where('userId', '==', userId)
            .count()
            .get();

        return snapshot.data().count;
    } catch (error: any) {
        console.error('[transcriptRepository] Error counting transcripts:', error);
        return 0;
    }
}
