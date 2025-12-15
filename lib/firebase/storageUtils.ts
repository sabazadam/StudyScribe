/**
 * FIREBASE STORAGE UTILITIES
 * ==============================================================================
 * Utilities for uploading and managing files in Firebase Storage
 * Used for images and other binary assets to reduce Firestore document size
 * ==============================================================================
 */

import admin from '@/lib/firebase/adminConfig';
import { v4 as uuidv4 } from 'uuid';

// Storage bucket name from environment
const STORAGE_BUCKET = process.env.FB_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FB_PROJECT_ID}.appspot.com`;

// Get storage bucket
const getBucket = () => {
    try {
        return admin.storage().bucket(STORAGE_BUCKET);
    } catch (error) {
        console.error('[Storage] Failed to get storage bucket:', error);
        throw new Error('Storage not configured');
    }
};

/**
 * Upload an image to Firebase Storage
 * 
 * @param base64Data - Base64 encoded image data (without data URL prefix)
 * @param userId - User ID for path organization
 * @param materialId - Material ID for grouping
 * @param mimeType - Image MIME type (e.g., 'image/png')
 * @returns Object with storage URL and path
 */
export async function uploadImageToStorage(
    base64Data: string,
    userId: string,
    materialId: string,
    mimeType: string = 'image/png'
): Promise<{ url: string; storagePath: string }> {
    try {
        const bucket = getBucket();

        // Generate unique filename
        const extension = mimeType.split('/')[1] || 'png';
        const fileName = `${uuidv4()}.${extension}`;
        const storagePath = `materials/${userId}/${materialId}/${fileName}`;

        // Create file reference
        const file = bucket.file(storagePath);

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload file
        await file.save(buffer, {
            metadata: {
                contentType: mimeType,
                metadata: {
                    userId,
                    materialId,
                    uploadedAt: new Date().toISOString(),
                }
            }
        });

        // Make file publicly accessible
        await file.makePublic();

        // Get public URL
        const url = `https://storage.googleapis.com/${STORAGE_BUCKET}/${storagePath}`;

        console.log(`[Storage] Uploaded image: ${storagePath}`);

        return { url, storagePath };
    } catch (error) {
        console.error('[Storage] Error uploading image:', error);
        throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Upload multiple images to Firebase Storage
 * 
 * @param images - Array of images with base64 data
 * @param userId - User ID
 * @param materialId - Material ID
 * @returns Array of uploaded image info
 */
export async function uploadImagesToStorage(
    images: Array<{ data: string; mimeType?: string; prompt?: string }>,
    userId: string,
    materialId: string
): Promise<Array<{ url: string; storagePath: string; prompt?: string }>> {
    const uploadPromises = images.map(async (image) => {
        // Strip data URL prefix if present
        let base64Data = image.data;
        if (base64Data.includes(',')) {
            base64Data = base64Data.split(',')[1];
        }

        const result = await uploadImageToStorage(
            base64Data,
            userId,
            materialId,
            image.mimeType || 'image/png'
        );

        return {
            ...result,
            prompt: image.prompt,
        };
    });

    return Promise.all(uploadPromises);
}

/**
 * Delete an image from Firebase Storage
 * 
 * @param storagePath - Path to the file in storage
 */
export async function deleteImageFromStorage(storagePath: string): Promise<void> {
    try {
        const bucket = getBucket();
        const file = bucket.file(storagePath);

        await file.delete();
        console.log(`[Storage] Deleted image: ${storagePath}`);
    } catch (error) {
        console.error('[Storage] Error deleting image:', error);
        // Don't throw - file might not exist
    }
}

/**
 * Delete all images for a material
 * 
 * @param userId - User ID
 * @param materialId - Material ID
 */
export async function deleteAllImagesForMaterial(
    userId: string,
    materialId: string
): Promise<void> {
    try {
        const bucket = getBucket();
        const prefix = `materials/${userId}/${materialId}/`;

        const [files] = await bucket.getFiles({ prefix });

        if (files.length > 0) {
            await Promise.all(files.map(file => file.delete()));
            console.log(`[Storage] Deleted ${files.length} images for material ${materialId}`);
        }
    } catch (error) {
        console.error('[Storage] Error deleting material images:', error);
    }
}

/**
 * Get signed URL for private file access
 * Use this instead of public URLs for sensitive content
 * 
 * @param storagePath - Path to the file
 * @param expiresInMinutes - URL expiration time
 * @returns Signed URL
 */
export async function getSignedUrl(
    storagePath: string,
    expiresInMinutes: number = 60
): Promise<string> {
    try {
        const bucket = getBucket();
        const file = bucket.file(storagePath);

        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + expiresInMinutes * 60 * 1000,
        });

        return url;
    } catch (error) {
        console.error('[Storage] Error generating signed URL:', error);
        throw new Error('Failed to generate signed URL');
    }
}

/**
 * Calculate estimated storage size from base64 data
 * Base64 is ~33% larger than binary
 * 
 * @param base64Data - Base64 encoded data
 * @returns Size in bytes
 */
export function estimateBase64Size(base64Data: string): number {
    // Remove data URL prefix if present
    if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
    }
    // Base64 encodes 3 bytes into 4 characters
    return Math.round((base64Data.length * 3) / 4);
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
