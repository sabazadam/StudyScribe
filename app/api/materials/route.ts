import { NextRequest, NextResponse } from 'next/server';
import {
  saveMaterials,
  getAllMaterials,
  getMaterialsByInstructor,
  getMaterial,
  getAllInstructors,
  getWeeksForInstructor,
  getLecturesForInstructorWeek,
  deleteMaterial,
  initializeStorage,
  type LectureMaterial
} from '@/lib/materialStorage';

// Initialize storage on module load
initializeStorage().catch(console.error);

// GET - Retrieve materials
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const instructor = searchParams.get('instructor');
    const week = searchParams.get('week');
    const lecture = searchParams.get('lecture');

    // Get all instructors
    if (action === 'instructors') {
      const instructors = await getAllInstructors();
      return NextResponse.json({
        success: true,
        instructors
      });
    }

    // Get weeks for an instructor
    if (action === 'weeks' && instructor) {
      const weeks = await getWeeksForInstructor(instructor);
      return NextResponse.json({
        success: true,
        weeks
      });
    }

    // Get lectures for an instructor and week
    if (action === 'lectures' && instructor && week) {
      const lectures = await getLecturesForInstructorWeek(instructor, parseInt(week));
      return NextResponse.json({
        success: true,
        lectures
      });
    }

    // Get specific material
    if (instructor && week && lecture) {
      const material = await getMaterial(
        instructor,
        parseInt(week),
        parseInt(lecture)
      );

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

    // Get materials by instructor
    if (instructor) {
      const materials = await getMaterialsByInstructor(instructor);
      return NextResponse.json({
        success: true,
        materials
      });
    }

    // Get all materials
    const materials = await getAllMaterials();
    return NextResponse.json({
      success: true,
      materials
    });

  } catch (error) {
    console.error('Error in GET /api/materials:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve materials'
      },
      { status: 500 }
    );
  }
}

// POST - Upload materials
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract metadata
    const instructorName = formData.get('instructorName') as string;
    const week = parseInt(formData.get('week') as string);
    const lectureNumber = parseInt(formData.get('lectureNumber') as string);

    // Validation
    if (!instructorName || !week || !lectureNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: instructorName, week, lectureNumber'
        },
        { status: 400 }
      );
    }

    if (isNaN(week) || isNaN(lectureNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Week and lectureNumber must be valid numbers'
        },
        { status: 400 }
      );
    }

    // Extract files
    const audioFiles: File[] = [];
    const slideFiles: File[] = [];
    const photoFiles: File[] = [];

    // Get all files from formData
    const entries = Array.from(formData.entries());
    for (const [key, value] of entries) {
      if (value instanceof File) {
        if (key.startsWith('audio-')) {
          audioFiles.push(value);
        } else if (key.startsWith('slide-')) {
          slideFiles.push(value);
        } else if (key.startsWith('photo-')) {
          photoFiles.push(value);
        }
      }
    }

    // Ensure at least one file is provided
    if (audioFiles.length === 0 && slideFiles.length === 0 && photoFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one file (audio, slide, or photo) must be provided'
        },
        { status: 400 }
      );
    }

    // Save materials
    const material = await saveMaterials(
      instructorName,
      week,
      lectureNumber,
      audioFiles,
      slideFiles,
      photoFiles
    );

    return NextResponse.json({
      success: true,
      message: 'Materials uploaded successfully',
      material
    });

  } catch (error) {
    console.error('Error in POST /api/materials:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload materials'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove materials
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Material ID is required'
        },
        { status: 400 }
      );
    }

    const deleted = await deleteMaterial(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Material not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/materials:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete material'
      },
      { status: 500 }
    );
  }
}
