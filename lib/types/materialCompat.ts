/**
 * MATERIAL TYPE COMPATIBILITY
 * ==============================================================================
 * Provides compatibility between old SavedStudyMaterial and new Firestore Material
 * This allows gradual migration of frontend components
 * ==============================================================================
 */

import { Material, MaterialType } from './firestore';

/**
 * Legacy SavedStudyMaterial interface (for backward compatibility)
 * Frontend components still expect this shape
 */
export interface SavedStudyMaterial {
  id: string;
  title: string;
  materialType: MaterialType;
  content: string;
  transcript: string; // Convenience field from sources
  sources: {
    hasAudio: boolean;
    hasSlides: boolean;
    hasPhotos: boolean;
  };
  metadata: {
    audioFileName?: string;
    slideFileNames?: string[];
    photoFileNames?: string[];
    duration?: number;
    wordCount: number;
  };
  rawExtraction?: {
    transcript: string;
    slideText: string;
    imageAnalysis: string;
  };
  linkedQuizzes?: string[];
  folderId?: string | null;
  folderPath?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert Firestore Material to legacy SavedStudyMaterial format
 * Allows existing components to work without changes
 *
 * @param material - Material from Firestore
 * @returns SavedStudyMaterial compatible object
 */
export function materialToSavedMaterial(material: Material): SavedStudyMaterial {
  // Extract transcript from sources for backward compatibility
  const transcript = material.sources.transcript || '';

  // Determine source availability
  const hasAudio = !!material.sources.transcript;
  const hasSlides = !!material.sources.slideText;
  const hasPhotos = !!material.sources.imageAnalysis;

  // Calculate word count from content
  const wordCount = material.content.split(/\s+/).length;

  return {
    id: material.id,
    title: material.title,
    materialType: material.materialType,
    content: material.content,
    transcript, // Direct field for easy access
    sources: {
      hasAudio,
      hasSlides,
      hasPhotos,
    },
    metadata: {
      wordCount,
      // Legacy fields - can be extended as needed
    },
    rawExtraction: {
      transcript: material.sources.transcript || '',
      slideText: material.sources.slideText || '',
      imageAnalysis: material.sources.imageAnalysis || '',
    },
    linkedQuizzes: [], // To be implemented: track quizzes linked to this material
    folderId: material.folderId,
    folderPath: material.folderPath,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  };
}

/**
 * Convert array of Materials to SavedStudyMaterial array
 *
 * @param materials - Array of Firestore Materials
 * @returns Array of SavedStudyMaterial objects
 */
export function materialsToSavedMaterials(materials: Material[]): SavedStudyMaterial[] {
  return materials.map(materialToSavedMaterial);
}
