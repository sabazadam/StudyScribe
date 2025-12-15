/**
 * MATERIAL REPOSITORY
 * ==============================================================================
 * Firestore repository for study materials with user data isolation
 * All operations enforce userId-based security
 * ==============================================================================
 */

import { adminDb } from '@/lib/firebase/adminConfig';
import admin from '@/lib/firebase/adminConfig';
import { Timestamp } from 'firebase-admin/firestore';
import {
  MaterialDocument,
  Material,
  MaterialType,
  MaterialSources,
  MaterialImageData,
  MaterialListItem,
  PaginatedMaterialList,
  materialDocumentToMaterial,
} from '@/lib/types/firestore';

const MATERIALS_COLLECTION = 'materials';

/**
 * Input type for creating a new material
 */
export interface CreateMaterialInput {
  content: string;
  materialType: MaterialType;
  sources: MaterialSources;
  imageData?: MaterialImageData;
  title: string;
  tags?: string[];
  folderId?: string | null;
  folderPath?: string[];
}

/**
 * Input type for updating an existing material
 */
export interface UpdateMaterialInput {
  content?: string;
  title?: string;
  tags?: string[];
  imageData?: MaterialImageData;
}

/**
 * Save a new material to Firestore
 *
 * @param userId - Owner of the material
 * @param materialData - Material data to save
 * @returns Material ID
 */
/**
 * Remove undefined values from an object (Firestore doesn't accept undefined)
 */
function cleanUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively clean nested objects
        cleaned[key] = cleanUndefined(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

export async function saveMaterial(
  userId: string,
  materialData: CreateMaterialInput
): Promise<string> {
  try {
    if (!userId) {
      throw new Error('userId is required to save material');
    }

    const materialsRef = adminDb.collection(MATERIALS_COLLECTION);

    // Clean undefined values from sources
    const cleanedSources = cleanUndefined(materialData.sources);

    const docData = {
      userId,
      content: materialData.content,
      materialType: materialData.materialType,
      sources: cleanedSources,
      imageData: materialData.imageData || null,
      title: materialData.title,
      tags: materialData.tags || [],
      folderId: materialData.folderId || null,
      folderPath: materialData.folderPath || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await materialsRef.add(docData);

    console.log('[materialRepository] Material saved:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('[materialRepository] Error saving material:', error);
    throw new Error(`Failed to save material: ${error.message}`);
  }
}

/**
 * Get a material by ID with userId verification
 *
 * @param materialId - Material document ID
 * @param userId - User requesting the material (must match owner)
 * @returns Material or null if not found or unauthorized
 */
export async function getMaterialById(
  materialId: string,
  userId: string
): Promise<Material | null> {
  try {
    if (!materialId || !userId) {
      throw new Error('materialId and userId are required');
    }

    const docRef = adminDb.collection(MATERIALS_COLLECTION).doc(materialId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log('[materialRepository] Material not found:', materialId);
      return null;
    }

    const data = docSnap.data();
    if (!data) {
      return null;
    }

    // Security check: verify userId matches
    if (data.userId !== userId) {
      console.warn('[materialRepository] Unauthorized access attempt:', {
        materialId,
        requestedBy: userId,
        owner: data.userId,
      });
      return null;
    }

    const materialDoc: MaterialDocument = {
      id: docSnap.id,
      userId: data.userId,
      content: data.content,
      materialType: data.materialType,
      sources: data.sources,
      imageData: data.imageData || undefined,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
      title: data.title,
      tags: data.tags || [],
      folderId: data.folderId || null,
      folderPath: data.folderPath || [],
    };

    return materialDocumentToMaterial(materialDoc);
  } catch (error: any) {
    console.error('[materialRepository] Error getting material:', error);
    throw new Error(`Failed to get material: ${error.message}`);
  }
}

/**
 * Get all materials for a user
 *
 * @param userId - User ID to fetch materials for
 * @param limitCount - Maximum number of materials to return (default: 50)
 * @returns Array of materials
 */
export async function getUserMaterials(
  userId: string,
  limitCount: number = 50
): Promise<Material[]> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const materialsRef = adminDb.collection(MATERIALS_COLLECTION);
    const querySnapshot = await materialsRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    const materials: Material[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const materialDoc: MaterialDocument = {
        id: doc.id,
        userId: data.userId,
        content: data.content,
        materialType: data.materialType,
        sources: data.sources,
        imageData: data.imageData || undefined,
        createdAt: data.createdAt as Timestamp,
        updatedAt: data.updatedAt as Timestamp,
        title: data.title,
        tags: data.tags || [],
        folderId: data.folderId || null,
        folderPath: data.folderPath || [],
      };
      materials.push(materialDocumentToMaterial(materialDoc));
    });

    console.log('[materialRepository] Fetched materials:', materials.length);
    return materials;
  } catch (error: any) {
    console.error('[materialRepository] Error getting user materials:', error);
    throw new Error(`Failed to get user materials: ${error.message}`);
  }
}

/**
 * Get materials by type for a user
 *
 * @param userId - User ID
 * @param materialType - Type of material to filter by
 * @param limitCount - Maximum number of materials to return
 * @returns Array of materials
 */
export async function getUserMaterialsByType(
  userId: string,
  materialType: MaterialType,
  limitCount: number = 50
): Promise<Material[]> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const materialsRef = adminDb.collection(MATERIALS_COLLECTION);
    const querySnapshot = await materialsRef
      .where('userId', '==', userId)
      .where('materialType', '==', materialType)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    const materials: Material[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const materialDoc: MaterialDocument = {
        id: doc.id,
        userId: data.userId,
        content: data.content,
        materialType: data.materialType,
        sources: data.sources,
        imageData: data.imageData || undefined,
        createdAt: data.createdAt as Timestamp,
        updatedAt: data.updatedAt as Timestamp,
        title: data.title,
        tags: data.tags || [],
        folderId: data.folderId || null,
        folderPath: data.folderPath || [],
      };
      materials.push(materialDocumentToMaterial(materialDoc));
    });

    console.log('[materialRepository] Fetched materials by type:', materials.length);
    return materials;
  } catch (error: any) {
    console.error('[materialRepository] Error getting materials by type:', error);
    throw new Error(`Failed to get materials by type: ${error.message}`);
  }
}

/**
 * Update an existing material
 *
 * @param materialId - Material document ID
 * @param userId - User requesting the update (must match owner)
 * @param updates - Fields to update
 * @returns void
 */
export async function updateMaterial(
  materialId: string,
  userId: string,
  updates: UpdateMaterialInput
): Promise<void> {
  try {
    if (!materialId || !userId) {
      throw new Error('materialId and userId are required');
    }

    // First verify ownership
    const material = await getMaterialById(materialId, userId);
    if (!material) {
      throw new Error('Material not found or unauthorized');
    }

    const docRef = adminDb.collection(MATERIALS_COLLECTION).doc(materialId);

    const updateData: any = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.update(updateData);

    console.log('[materialRepository] Material updated:', materialId);
  } catch (error: any) {
    console.error('[materialRepository] Error updating material:', error);
    throw new Error(`Failed to update material: ${error.message}`);
  }
}

/**
 * Delete a material
 *
 * @param materialId - Material document ID
 * @param userId - User requesting the delete (must match owner)
 * @returns void
 */
export async function deleteMaterial(
  materialId: string,
  userId: string
): Promise<void> {
  try {
    if (!materialId || !userId) {
      throw new Error('materialId and userId are required');
    }

    // First verify ownership
    const material = await getMaterialById(materialId, userId);
    if (!material) {
      throw new Error('Material not found or unauthorized');
    }

    const docRef = adminDb.collection(MATERIALS_COLLECTION).doc(materialId);
    await docRef.delete();

    console.log('[materialRepository] Material deleted:', materialId);
  } catch (error: any) {
    console.error('[materialRepository] Error deleting material:', error);
    throw new Error(`Failed to delete material: ${error.message}`);
  }
}

/**
 * Search materials by title or content (basic text search)
 * Note: For production, consider using Algolia or Elasticsearch for better search
 *
 * @param userId - User ID
 * @param searchQuery - Search query
 * @returns Array of matching materials
 */
export async function searchMaterials(
  userId: string,
  searchQuery: string
): Promise<Material[]> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Get all user materials (this is inefficient for large datasets)
    const materials = await getUserMaterials(userId, 100);

    // Filter by search query (case-insensitive)
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = materials.filter(material =>
      material.title.toLowerCase().includes(lowerQuery) ||
      material.content.toLowerCase().includes(lowerQuery)
    );

    console.log('[materialRepository] Search results:', filtered.length);
    return filtered;
  } catch (error: any) {
    console.error('[materialRepository] Error searching materials:', error);
    throw new Error(`Failed to search materials: ${error.message}`);
  }
}

/**
 * Get paginated list of materials (lightweight - excludes content/sources/images)
 * Optimized for Study Hub display - reduces data transfer significantly
 *
 * @param userId - User ID to fetch materials for
 * @param pageSize - Number of materials per page (default: 8)
 * @param cursor - Document ID to start after (for pagination)
 * @returns Paginated list of lightweight material items
 */
export async function getMaterialsList(
  userId: string,
  pageSize: number = 8,
  cursor?: string
): Promise<PaginatedMaterialList> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const materialsRef = adminDb.collection(MATERIALS_COLLECTION);

    // Build query - fetch pageSize + 1 to determine if there are more
    let query = materialsRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(pageSize + 1);

    // If cursor provided, start after that document
    if (cursor) {
      const cursorDoc = await materialsRef.doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const querySnapshot = await query.get();
    const docs = querySnapshot.docs;

    // Check if there are more results
    const hasMore = docs.length > pageSize;
    const materialsToReturn = hasMore ? docs.slice(0, pageSize) : docs;

    const materials: MaterialListItem[] = materialsToReturn.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt as Timestamp;
      const updatedAt = data.updatedAt as Timestamp;

      return {
        id: doc.id,
        userId: data.userId,
        title: data.title || 'Untitled',
        materialType: data.materialType,
        createdAt: createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        folderId: data.folderId || null,
        folderPath: data.folderPath || [],
        tags: data.tags || [],
        // Compute metadata flags without fetching full data
        hasImages: !!(data.imageData?.images?.length),
        hasTranscript: !!data.sources?.transcript,
        hasSlides: !!data.sources?.slideText,
      };
    });

    // Get the last document ID for next cursor
    const lastDoc = materialsToReturn[materialsToReturn.length - 1];
    const nextCursor = hasMore && lastDoc ? lastDoc.id : undefined;

    console.log(`[materialRepository] Fetched ${materials.length} materials (page), hasMore: ${hasMore}`);

    return {
      materials,
      nextCursor,
      hasMore,
    };
  } catch (error: any) {
    console.error('[materialRepository] Error getting materials list:', error);
    throw new Error(`Failed to get materials list: ${error.message}`);
  }
}

/**
 * Get total count of materials for a user
 * Useful for showing "X of Y" in pagination
 */
export async function getMaterialsCount(userId: string): Promise<number> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const snapshot = await adminDb.collection(MATERIALS_COLLECTION)
      .where('userId', '==', userId)
      .count()
      .get();

    return snapshot.data().count;
  } catch (error: any) {
    console.error('[materialRepository] Error counting materials:', error);
    throw new Error(`Failed to count materials: ${error.message}`);
  }
}
