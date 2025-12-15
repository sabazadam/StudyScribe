import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Types for saved study materials
export interface SavedStudyMaterial {
  id: string;
  title: string;
  materialType: 'exam' | 'summary' | 'quiz' | 'mock-exam' | 'explain' | 'custom';
  content: string; // Generated markdown content
  transcript: string; // Separate transcript text
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
  // Raw extraction data for regenerating different material types
  rawExtraction?: {
    transcript: string;
    slideText: string;
    imageAnalysis: string;
  };
  // Linked quizzes generated from this material
  linkedQuizzes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyMaterialsDatabase {
  materials: SavedStudyMaterial[];
  lastUpdated: string;
}

// Paths
const STUDY_MATERIALS_DIR = path.join(process.cwd(), 'public', 'study-materials');
const METADATA_FILE = path.join(STUDY_MATERIALS_DIR, 'metadata.json');

// Initialize storage directory
export async function initializeStorage(): Promise<void> {
  try {
    await fs.mkdir(STUDY_MATERIALS_DIR, { recursive: true });

    // Create metadata file if it doesn't exist
    try {
      await fs.access(METADATA_FILE);
    } catch {
      const initialData: StudyMaterialsDatabase = {
        materials: [],
        lastUpdated: new Date().toISOString()
      };
      await fs.writeFile(METADATA_FILE, JSON.stringify(initialData, null, 2));
    }
  } catch (error) {
    console.error('Error initializing study materials storage:', error);
    throw error;
  }
}

// Read metadata
async function readMetadata(): Promise<StudyMaterialsDatabase> {
  try {
    await initializeStorage();
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading study materials metadata:', error);
    return { materials: [], lastUpdated: new Date().toISOString() };
  }
}

// Write metadata
async function writeMetadata(data: StudyMaterialsDatabase): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(METADATA_FILE, JSON.stringify(data, null, 2));
}

// Generate unique ID
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Count words in text
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

// Save a new study material
export async function saveMaterial(
  data: Omit<SavedStudyMaterial, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SavedStudyMaterial> {
  const db = await readMetadata();

  const newMaterial: SavedStudyMaterial = {
    ...data,
    id: generateId(),
    metadata: {
      ...data.metadata,
      wordCount: countWords(data.content)
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.materials.unshift(newMaterial); // Add to beginning (most recent first)
  await writeMetadata(db);

  return newMaterial;
}

// Get all saved materials
export async function getAllMaterials(): Promise<SavedStudyMaterial[]> {
  const db = await readMetadata();
  return db.materials;
}

// Get material by ID
export async function getMaterialById(id: string): Promise<SavedStudyMaterial | null> {
  const db = await readMetadata();
  return db.materials.find(m => m.id === id) || null;
}

// Update existing material
export async function updateMaterial(
  id: string,
  updates: Partial<Omit<SavedStudyMaterial, 'id' | 'createdAt'>>
): Promise<SavedStudyMaterial | null> {
  const db = await readMetadata();
  const index = db.materials.findIndex(m => m.id === id);

  if (index === -1) {
    return null;
  }

  db.materials[index] = {
    ...db.materials[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await writeMetadata(db);
  return db.materials[index];
}

// Delete material
export async function deleteMaterial(id: string): Promise<boolean> {
  const db = await readMetadata();
  const initialLength = db.materials.length;

  db.materials = db.materials.filter(m => m.id !== id);

  if (db.materials.length === initialLength) {
    return false; // Material not found
  }

  await writeMetadata(db);
  return true;
}

// Search materials
export async function searchMaterials(query: string): Promise<SavedStudyMaterial[]> {
  const db = await readMetadata();
  const lowerQuery = query.toLowerCase();

  return db.materials.filter(m =>
    m.title.toLowerCase().includes(lowerQuery) ||
    m.content.toLowerCase().includes(lowerQuery) ||
    m.transcript.toLowerCase().includes(lowerQuery)
  );
}

// Get materials by type
export async function getMaterialsByType(
  type: SavedStudyMaterial['materialType']
): Promise<SavedStudyMaterial[]> {
  const db = await readMetadata();
  return db.materials.filter(m => m.materialType === type);
}
