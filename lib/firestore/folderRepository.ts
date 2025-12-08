/**
 * FOLDER REPOSITORY
 * ==============================================================================
 * CRUD operations for folder management in Firestore
 * Handles folder creation, retrieval, updates, and deletion
 * ==============================================================================
 */

import { adminDb } from '@/lib/firebase/adminConfig';
import admin from '@/lib/firebase/adminConfig';
import { Timestamp } from 'firebase-admin/firestore';
import {
  FolderDocument,
  Folder,
  folderDocumentToFolder,
  isFolderDocument,
} from '@/lib/types/firestore';

const FOLDERS_COLLECTION = 'folders';
const MATERIALS_COLLECTION = 'materials';

/**
 * Create a new folder
 */
export async function createFolder(
  userId: string,
  name: string,
  parentFolderId: string | null = null,
  options?: {
    color?: string;
    emoji?: string;
  }
): Promise<Folder> {
  // Build the path array
  let path: string[] = [name];

  if (parentFolderId) {
    // Get parent folder to build path
    const parentFolder = await getFolderById(parentFolderId, userId);
    if (!parentFolder) {
      throw new Error('Parent folder not found');
    }
    path = [...parentFolder.path, name];
  }

  const folderData: Omit<FolderDocument, 'id'> = {
    userId,
    name,
    parentFolderId,
    path,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    materialCount: 0,
    ...(options?.color && { color: options.color }),
    ...(options?.emoji && { emoji: options.emoji }),
  };

  const docRef = await adminDb.collection(FOLDERS_COLLECTION).add(folderData);

  const newFolder: FolderDocument = {
    id: docRef.id,
    ...folderData,
  };

  return folderDocumentToFolder(newFolder);
}

/**
 * Get folder by ID
 */
export async function getFolderById(folderId: string, userId: string): Promise<Folder | null> {
  const docRef = adminDb.collection(FOLDERS_COLLECTION).doc(folderId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }

  const data = { id: docSnap.id, ...docSnap.data() };

  if (!isFolderDocument(data)) {
    console.error('[FolderRepository] Invalid folder document structure:', data);
    return null;
  }

  // Verify ownership
  if (data.userId !== userId) {
    console.error('[FolderRepository] User does not own this folder');
    return null;
  }

  return folderDocumentToFolder(data);
}

/**
 * Get all folders for a user
 */
export async function getUserFolders(userId: string): Promise<Folder[]> {
  const querySnapshot = await adminDb.collection(FOLDERS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  const folders: Folder[] = [];

  querySnapshot.forEach((doc) => {
    const data = { id: doc.id, ...doc.data() };
    if (isFolderDocument(data)) {
      folders.push(folderDocumentToFolder(data));
    }
  });

  return folders;
}

/**
 * Get folders by parent ID (for building folder tree)
 */
export async function getFoldersByParent(
  userId: string,
  parentFolderId: string | null
): Promise<Folder[]> {
  const querySnapshot = await adminDb.collection(FOLDERS_COLLECTION)
    .where('userId', '==', userId)
    .where('parentFolderId', '==', parentFolderId)
    .orderBy('name', 'asc')
    .get();

  const folders: Folder[] = [];

  querySnapshot.forEach((doc) => {
    const data = { id: doc.id, ...doc.data() };
    if (isFolderDocument(data)) {
      folders.push(folderDocumentToFolder(data));
    }
  });

  return folders;
}

/**
 * Update folder name or metadata
 */
export async function updateFolder(
  folderId: string,
  userId: string,
  updates: {
    name?: string;
    color?: string;
    emoji?: string;
  }
): Promise<Folder> {
  // Verify ownership first
  const existingFolder = await getFolderById(folderId, userId);
  if (!existingFolder) {
    throw new Error('Folder not found or access denied');
  }

  const docRef = adminDb.collection(FOLDERS_COLLECTION).doc(folderId);

  // If name is being updated, we need to update paths of all child folders
  if (updates.name && updates.name !== existingFolder.name) {
    await updateFolderPathsRecursively(folderId, userId, updates.name, existingFolder);
  }

  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };

  await docRef.update(updateData);

  // Return updated folder
  const updatedFolder = await getFolderById(folderId, userId);
  if (!updatedFolder) {
    throw new Error('Failed to retrieve updated folder');
  }

  return updatedFolder;
}

/**
 * Update folder paths recursively when parent folder is renamed
 */
async function updateFolderPathsRecursively(
  folderId: string,
  userId: string,
  newName: string,
  existingFolder: Folder
): Promise<void> {
  const batch = adminDb.batch();

  // Update this folder's path
  const newPath = [...existingFolder.path];
  newPath[newPath.length - 1] = newName;

  const folderRef = adminDb.collection(FOLDERS_COLLECTION).doc(folderId);
  batch.update(folderRef, {
    name: newName,
    path: newPath,
    updatedAt: Timestamp.now(),
  });

  // Get all child folders
  const childFolders = await getFoldersByParent(userId, folderId);

  // Update each child's path
  for (const child of childFolders) {
    const childNewPath = [newName, ...child.path.slice(existingFolder.path.length)];
    const childRef = adminDb.collection(FOLDERS_COLLECTION).doc(child.id);
    batch.update(childRef, {
      path: childNewPath,
      updatedAt: Timestamp.now(),
    });
  }

  await batch.commit();
}

/**
 * Delete folder and optionally delete all materials inside
 */
export async function deleteFolder(
  folderId: string,
  userId: string,
  deleteMaterials: boolean = true
): Promise<void> {
  // Verify ownership
  const folder = await getFolderById(folderId, userId);
  if (!folder) {
    throw new Error('Folder not found or access denied');
  }

  const batch = adminDb.batch();

  // Delete all child folders recursively
  const childFolders = await getFoldersByParent(userId, folderId);
  for (const child of childFolders) {
    await deleteFolder(child.id, userId, deleteMaterials);
  }

  // Handle materials in this folder
  if (deleteMaterials) {
    // Delete all materials in this folder
    const materialsSnapshot = await adminDb.collection(MATERIALS_COLLECTION)
      .where('userId', '==', userId)
      .where('folderId', '==', folderId)
      .get();

    materialsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
  } else {
    // Move materials to no folder (root level)
    const materialsSnapshot = await adminDb.collection(MATERIALS_COLLECTION)
      .where('userId', '==', userId)
      .where('folderId', '==', folderId)
      .get();

    materialsSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        folderId: null,
        folderPath: [],
        updatedAt: Timestamp.now(),
      });
    });
  }

  // Delete the folder itself
  const folderRef = adminDb.collection(FOLDERS_COLLECTION).doc(folderId);
  batch.delete(folderRef);

  await batch.commit();
}

/**
 * Move material to a folder
 */
export async function moveMaterialToFolder(
  materialId: string,
  folderId: string | null,
  userId: string
): Promise<void> {
  let folderPath: string[] = [];

  if (folderId) {
    const folder = await getFolderById(folderId, userId);
    if (!folder) {
      throw new Error('Target folder not found');
    }
    folderPath = folder.path;
  }

  const materialRef = adminDb.collection(MATERIALS_COLLECTION).doc(materialId);
  await materialRef.update({
    folderId,
    folderPath,
    updatedAt: Timestamp.now(),
  });

  // Update material count for both old and new folders
  // This would require tracking the old folder, which we can implement later
}

/**
 * Get material count for a folder
 */
export async function getFolderMaterialCount(
  folderId: string,
  userId: string
): Promise<number> {
  const snapshot = await adminDb
    .collection(MATERIALS_COLLECTION)
    .where('userId', '==', userId)
    .where('folderId', '==', folderId)
    .get();

  return snapshot.size;
}

/**
 * Update cached material count for a folder
 */
export async function updateFolderMaterialCount(
  folderId: string,
  userId: string
): Promise<void> {
  const count = await getFolderMaterialCount(folderId, userId);
  const folderRef = adminDb.collection(FOLDERS_COLLECTION).doc(folderId);

  await folderRef.update({
    materialCount: count,
    updatedAt: Timestamp.now(),
  });
}
