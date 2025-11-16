import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Types for materials
export interface MaterialFile {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: 'audio' | 'video' | 'slide' | 'photo';
  size: number;
  uploadedAt: string;
}

export interface LectureMaterial {
  id: string;
  instructorName: string;
  week: number;
  lectureNumber: number;
  audioFiles: MaterialFile[];
  slideFiles: MaterialFile[];
  photoFiles: MaterialFile[];
  uploadedAt: string;
  updatedAt: string;
}

export interface MaterialsDatabase {
  materials: LectureMaterial[];
  lastUpdated: string;
}

// Paths
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'materials');
const METADATA_FILE = path.join(UPLOADS_DIR, 'metadata.json');

// Initialize storage directory
export async function initializeStorage(): Promise<void> {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    // Create metadata file if it doesn't exist
    try {
      await fs.access(METADATA_FILE);
    } catch {
      const initialData: MaterialsDatabase = {
        materials: [],
        lastUpdated: new Date().toISOString()
      };
      await fs.writeFile(METADATA_FILE, JSON.stringify(initialData, null, 2));
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
    throw error;
  }
}

// Read metadata
async function readMetadata(): Promise<MaterialsDatabase> {
  try {
    await initializeStorage();
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading metadata:', error);
    return { materials: [], lastUpdated: new Date().toISOString() };
  }
}

// Write metadata
async function writeMetadata(data: MaterialsDatabase): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(METADATA_FILE, JSON.stringify(data, null, 2));
}

// Generate unique ID
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Determine file type
function determineFileType(fileName: string): 'audio' | 'video' | 'slide' | 'photo' {
  const ext = path.extname(fileName).toLowerCase();

  if (['.mp3', '.wav', '.m4a', '.aac', '.ogg'].includes(ext)) {
    return 'audio';
  }
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
    return 'video';
  }
  if (['.pdf', '.pptx', '.ppt'].includes(ext)) {
    return 'slide';
  }
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    return 'photo';
  }

  // Default based on common patterns
  return 'photo';
}

// Save files to disk
async function saveFile(
  file: File,
  instructorName: string,
  week: number,
  lectureNumber: number
): Promise<MaterialFile> {
  const fileId = generateId();
  const ext = path.extname(file.name);
  const sanitizedInstructor = instructorName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  const fileName = `${fileId}${ext}`;

  // Create directory structure
  const dirPath = path.join(UPLOADS_DIR, sanitizedInstructor, `week-${week}`, `lecture-${lectureNumber}`);
  await fs.mkdir(dirPath, { recursive: true });

  // Save file
  const filePath = path.join(dirPath, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // Create relative path for public access
  const relativePath = `/uploads/materials/${sanitizedInstructor}/week-${week}/lecture-${lectureNumber}/${fileName}`;

  return {
    id: fileId,
    fileName,
    originalName: file.name,
    filePath: relativePath,
    fileType: determineFileType(file.name),
    size: file.size,
    uploadedAt: new Date().toISOString()
  };
}

// Save materials
export async function saveMaterials(
  instructorName: string,
  week: number,
  lectureNumber: number,
  audioFiles: File[],
  slideFiles: File[],
  photoFiles: File[]
): Promise<LectureMaterial> {
  await initializeStorage();

  // Save all files
  const savedAudioFiles = await Promise.all(
    audioFiles.map(file => saveFile(file, instructorName, week, lectureNumber))
  );

  const savedSlideFiles = await Promise.all(
    slideFiles.map(file => saveFile(file, instructorName, week, lectureNumber))
  );

  const savedPhotoFiles = await Promise.all(
    photoFiles.map(file => saveFile(file, instructorName, week, lectureNumber))
  );

  // Create material entry
  const material: LectureMaterial = {
    id: generateId(),
    instructorName,
    week,
    lectureNumber,
    audioFiles: savedAudioFiles,
    slideFiles: savedSlideFiles,
    photoFiles: savedPhotoFiles,
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Update metadata
  const metadata = await readMetadata();

  // Check if material already exists for this instructor/week/lecture
  const existingIndex = metadata.materials.findIndex(
    m => m.instructorName === instructorName &&
         m.week === week &&
         m.lectureNumber === lectureNumber
  );

  if (existingIndex !== -1) {
    // Update existing
    material.id = metadata.materials[existingIndex].id;
    material.uploadedAt = metadata.materials[existingIndex].uploadedAt;
    metadata.materials[existingIndex] = material;
  } else {
    // Add new
    metadata.materials.push(material);
  }

  await writeMetadata(metadata);

  return material;
}

// Get all materials
export async function getAllMaterials(): Promise<LectureMaterial[]> {
  const metadata = await readMetadata();
  return metadata.materials;
}

// Get materials by instructor
export async function getMaterialsByInstructor(instructorName: string): Promise<LectureMaterial[]> {
  const metadata = await readMetadata();
  return metadata.materials.filter(m => m.instructorName === instructorName);
}

// Get material by instructor, week, and lecture
export async function getMaterial(
  instructorName: string,
  week: number,
  lectureNumber: number
): Promise<LectureMaterial | null> {
  const metadata = await readMetadata();
  return metadata.materials.find(
    m => m.instructorName === instructorName &&
         m.week === week &&
         m.lectureNumber === lectureNumber
  ) || null;
}

// Get all instructors
export async function getAllInstructors(): Promise<string[]> {
  const metadata = await readMetadata();
  const instructors = new Set(metadata.materials.map(m => m.instructorName));
  return Array.from(instructors).sort();
}

// Get weeks for an instructor
export async function getWeeksForInstructor(instructorName: string): Promise<number[]> {
  const metadata = await readMetadata();
  const weeks = new Set(
    metadata.materials
      .filter(m => m.instructorName === instructorName)
      .map(m => m.week)
  );
  return Array.from(weeks).sort((a, b) => a - b);
}

// Get lectures for an instructor and week
export async function getLecturesForInstructorWeek(
  instructorName: string,
  week: number
): Promise<number[]> {
  const metadata = await readMetadata();
  const lectures = new Set(
    metadata.materials
      .filter(m => m.instructorName === instructorName && m.week === week)
      .map(m => m.lectureNumber)
  );
  return Array.from(lectures).sort((a, b) => a - b);
}

// Delete material
export async function deleteMaterial(id: string): Promise<boolean> {
  const metadata = await readMetadata();
  const materialIndex = metadata.materials.findIndex(m => m.id === id);

  if (materialIndex === -1) {
    return false;
  }

  const material = metadata.materials[materialIndex];

  // Delete files
  try {
    const sanitizedInstructor = material.instructorName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    const dirPath = path.join(
      UPLOADS_DIR,
      sanitizedInstructor,
      `week-${material.week}`,
      `lecture-${material.lectureNumber}`
    );

    // Delete all files
    const allFiles = [
      ...material.audioFiles,
      ...material.slideFiles,
      ...material.photoFiles
    ];

    for (const file of allFiles) {
      try {
        await fs.unlink(path.join(process.cwd(), 'public', file.filePath));
      } catch (error) {
        console.error(`Error deleting file ${file.filePath}:`, error);
      }
    }

    // Try to remove directory if empty
    try {
      await fs.rmdir(dirPath);
    } catch {
      // Directory not empty or doesn't exist, ignore
    }
  } catch (error) {
    console.error('Error deleting material files:', error);
  }

  // Remove from metadata
  metadata.materials.splice(materialIndex, 1);
  await writeMetadata(metadata);

  return true;
}
