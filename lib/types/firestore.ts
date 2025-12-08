/**
 * FIRESTORE TYPE DEFINITIONS
 * ==============================================================================
 * TypeScript interfaces for Firestore document structures
 * Provides type safety for all database operations
 * ==============================================================================
 */

import { Timestamp } from 'firebase-admin/firestore';

/**
 * Material types supported by the system
 */
export type MaterialType = 'summary' | 'exam' | 'quiz' | 'mock-exam' | 'explain' | 'custom';

/**
 * Material sources - tracks where content came from
 */
export interface MaterialSources {
  transcript?: string;
  slideText?: string;
  imageAnalysis?: string;
}

/**
 * Image data embedded in materials
 */
export interface MaterialImageData {
  count: number;
  images: Array<{
    prompt: string;
    data: string; // Base64 encoded image data
    mimeType?: string;
  }>;
}

/**
 * Main material document stored in Firestore
 * Collection: materials/{materialId}
 */
export interface MaterialDocument {
  id: string;
  userId: string; // Owner of this material
  content: string; // AI-generated markdown content
  materialType: MaterialType;
  sources: MaterialSources;
  imageData?: MaterialImageData;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  title: string; // Extracted from content or user-provided
  tags?: string[]; // For categorization
  folderId?: string | null; // Reference to parent folder
  folderPath?: string[]; // Breadcrumb path for display
}

/**
 * Client-side material type (with serialized timestamps)
 */
export interface Material {
  id: string;
  userId: string;
  content: string;
  materialType: MaterialType;
  sources: MaterialSources;
  imageData?: MaterialImageData;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  title: string;
  tags?: string[];
  folderId?: string | null;
  folderPath?: string[];
}

/**
 * Quiz question structure
 */
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  explanation: string;
  points: number;
}

/**
 * Quiz metadata
 */
export interface QuizMetadata {
  totalQuestions: number;
  totalPoints: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Quiz document stored in Firestore
 * Collection: quizzes/{quizId}
 */
export interface QuizDocument {
  id: string;
  userId: string; // Owner of this quiz
  quiz: {
    title: string;
    description: string;
    timeLimit?: number; // In seconds
    questions: QuizQuestion[];
  };
  sources: MaterialSources; // Same as materials
  createdAt: Timestamp;
  metadata: QuizMetadata;
}

/**
 * Client-side quiz type (with serialized timestamps)
 */
export interface Quiz {
  id: string;
  userId: string;
  quiz: {
    title: string;
    description: string;
    timeLimit?: number;
    questions: QuizQuestion[];
  };
  sources: MaterialSources;
  createdAt: string; // ISO string
  metadata: QuizMetadata;
}

/**
 * Quiz attempt document stored in Firestore
 * Collection: quiz-attempts/{attemptId}
 */
export interface QuizAttemptDocument {
  id: string;
  userId: string; // Student who took the quiz
  quizId: string; // Reference to quiz
  answers: Record<string, number>; // questionId -> selected option index
  score: number; // Number of correct answers
  totalPoints: number;
  completedAt: Timestamp;
  timeSpent: number; // In seconds
}

/**
 * Client-side quiz attempt type
 */
export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  answers: Record<string, number>;
  score: number;
  totalPoints: number;
  completedAt: string; // ISO string
  timeSpent: number;
}

/**
 * Type guards for runtime validation
 */
export function isMaterialDocument(data: any): data is MaterialDocument {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.userId === 'string' &&
    typeof data.content === 'string' &&
    typeof data.materialType === 'string' &&
    typeof data.sources === 'object' &&
    data.createdAt instanceof Timestamp &&
    data.updatedAt instanceof Timestamp
  );
}

export function isQuizDocument(data: any): data is QuizDocument {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.userId === 'string' &&
    typeof data.quiz === 'object' &&
    typeof data.sources === 'object' &&
    data.createdAt instanceof Timestamp
  );
}

/**
 * Helper to convert Firestore Timestamp to ISO string
 */
export function timestampToISO(timestamp: Timestamp): string {
  return timestamp.toDate().toISOString();
}

/**
 * Helper to convert MaterialDocument to Material (client-safe)
 */
export function materialDocumentToMaterial(doc: MaterialDocument): Material {
  return {
    ...doc,
    createdAt: timestampToISO(doc.createdAt),
    updatedAt: timestampToISO(doc.updatedAt),
  };
}

/**
 * Helper to convert QuizDocument to Quiz (client-safe)
 */
export function quizDocumentToQuiz(doc: QuizDocument): Quiz {
  return {
    ...doc,
    createdAt: timestampToISO(doc.createdAt),
  };
}

/**
 * Helper to convert QuizAttemptDocument to QuizAttempt (client-safe)
 */
export function quizAttemptDocumentToQuizAttempt(doc: QuizAttemptDocument): QuizAttempt {
  return {
    ...doc,
    completedAt: timestampToISO(doc.completedAt),
  };
}

/**
 * Folder document stored in Firestore
 * Collection: folders/{folderId}
 */
export interface FolderDocument {
  id: string;
  userId: string; // Owner of this folder
  name: string; // Folder display name
  parentFolderId: string | null; // Parent folder ID (null for root folders)
  path: string[]; // Array of folder names from root to this folder (e.g., ["CS101", "Week 3"])
  createdAt: Timestamp;
  updatedAt: Timestamp;
  color?: string; // Optional color for folder display (hex color)
  materialCount?: number; // Cached count of materials in this folder
  emoji?: string; // Optional emoji icon for folder
}

/**
 * Client-side folder type (with serialized timestamps)
 */
export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentFolderId: string | null;
  path: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  color?: string;
  materialCount?: number;
  emoji?: string;
}

/**
 * Type guard for FolderDocument
 */
export function isFolderDocument(data: any): data is FolderDocument {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.userId === 'string' &&
    typeof data.name === 'string' &&
    (data.parentFolderId === null || typeof data.parentFolderId === 'string') &&
    Array.isArray(data.path) &&
    data.createdAt instanceof Timestamp &&
    data.updatedAt instanceof Timestamp
  );
}

/**
 * Helper to convert FolderDocument to Folder (client-safe)
 */
export function folderDocumentToFolder(doc: FolderDocument): Folder {
  return {
    ...doc,
    createdAt: timestampToISO(doc.createdAt),
    updatedAt: timestampToISO(doc.updatedAt),
  };
}
