import { NextRequest, NextResponse } from 'next/server';
import {
  saveMaterial,
  getAllMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  searchMaterials,
  getMaterialsByType,
  initializeStorage,
  type SavedStudyMaterial
} from '@/lib/studyMaterialStorage';

// Initialize storage on module load
initializeStorage().catch(console.error);

// GET - Retrieve study materials
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    // Get specific material by ID
    if (id) {
      const material = await getMaterialById(id);

      if (!material) {
        return NextResponse.json(
          { success: false, error: 'Material not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        material
      });
    }

    // Search materials
    if (search) {
      const materials = await searchMaterials(search);
      return NextResponse.json({
        success: true,
        materials
      });
    }

    // Get materials by type
    if (type) {
      const materials = await getMaterialsByType(type as SavedStudyMaterial['materialType']);
      return NextResponse.json({
        success: true,
        materials
      });
    }

    // Get all materials (default)
    const materials = await getAllMaterials();
    return NextResponse.json({
      success: true,
      materials
    });
  } catch (error) {
    console.error('Error retrieving study materials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve materials' },
      { status: 500 }
    );
  }
}

// POST - Save new study material
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      materialType,
      content,
      transcript,
      sources,
      metadata,
      rawExtraction,
      linkedQuizzes
    } = body;

    // Validation
    if (!title || !materialType || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, materialType, content' },
        { status: 400 }
      );
    }

    // Save material
    const savedMaterial = await saveMaterial({
      title,
      materialType,
      content,
      transcript: transcript || '',
      sources: sources || { hasAudio: false, hasSlides: false, hasPhotos: false },
      metadata: metadata || { wordCount: 0 },
      rawExtraction: rawExtraction || undefined,
      linkedQuizzes: linkedQuizzes || undefined
    });

    return NextResponse.json({
      success: true,
      material: savedMaterial
    });
  } catch (error) {
    console.error('Error saving study material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save material' },
      { status: 500 }
    );
  }
}

// PATCH - Update existing material
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Material ID is required' },
        { status: 400 }
      );
    }

    const updatedMaterial = await updateMaterial(id, updates);

    if (!updatedMaterial) {
      return NextResponse.json(
        { success: false, error: 'Material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      material: updatedMaterial
    });
  } catch (error) {
    console.error('Error updating study material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update material' },
      { status: 500 }
    );
  }
}

// DELETE - Remove material
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Material ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteMaterial(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting study material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete material' },
      { status: 500 }
    );
  }
}
