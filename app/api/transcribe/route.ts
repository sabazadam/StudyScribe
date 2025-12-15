import { NextRequest, NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";
import { writeFile, unlink, readFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { Blob } from 'buffer';
import { verifyUserAuth } from '@/lib/middleware/authMiddleware';
import { withTimeout, TimeoutError } from '@/lib/utils/timeout';
import { saveTranscript } from '@/lib/firestore/transcriptRepository';

// Configure fal.ai with API key
fal.config({
  credentials: process.env.FAL_KEY
});

const execAsync = promisify(exec);

/**
 * Convert audio/video file to optimized WAV format using system FFmpeg
 * - Converts to mono (1 channel) to reduce size
 * - Sets sample rate to 16kHz (optimal for speech recognition)
 * - Reduces file size by ~75% while maintaining speech quality
 */
async function convertToWAV(inputBuffer: Buffer, originalName: string): Promise<Buffer> {
  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const inputPath = path.join(tempDir, `input-${timestamp}-${originalName}`);
  const outputPath = path.join(tempDir, `output-${timestamp}.wav`);

  try {
    // Write input file to temp directory
    await writeFile(inputPath, inputBuffer);
    console.log('Temp input file created:', inputPath);

    // Build FFmpeg command
    // -i: input file
    // -ac 1: mono audio (1 channel)
    // -ar 16000: 16kHz sample rate (optimal for speech)
    // -ab 64k: 64kbps bitrate
    // -f wav: output format WAV
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -ac 1 -ar 16000 -ab 64k -f wav "${outputPath}" -y`;
    console.log('FFmpeg command:', ffmpegCommand);

    // Execute FFmpeg command
    const { stdout, stderr } = await execAsync(ffmpegCommand);
    if (stderr) {
      console.log('FFmpeg stderr:', stderr);
    }
    console.log('Conversion complete');

    // Read converted file
    const outputBuffer = await readFile(outputPath);
    console.log('Original size:', inputBuffer.length, 'Converted size:', outputBuffer.length);
    console.log('Size reduction:', Math.round((1 - outputBuffer.length / inputBuffer.length) * 100) + '%');

    // Cleanup temp files
    await unlink(inputPath);
    await unlink(outputPath);
    console.log('Temp files cleaned up');

    return outputBuffer;
  } catch (error: any) {
    console.error('Conversion error:', error);
    console.error('Error stdout:', error.stdout);
    console.error('Error stderr:', error.stderr);

    // Cleanup temp files on error
    try {
      await unlink(inputPath).catch(() => { });
      await unlink(outputPath).catch(() => { });
    } catch { }

    throw new Error(`Audio conversion failed: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const user = await verifyUserAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in to transcribe audio.' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    // Accept both 'audio' (from transcribe page) and 'file' (for backward compat)
    const file = (formData.get('audio') || formData.get('file')) as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please upload an audio file.' },
        { status: 400 }
      );
    }

    console.log('=== TRANSCRIPTION API CALLED ===');
    console.log('File received:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size, 'bytes');

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to optimized WAV format
    console.log('Converting to optimized WAV format...');
    const wavBuffer = await convertToWAV(buffer, file.name);
    console.log('Conversion successful! Ready to upload.');

    // Upload converted WAV file to fal.ai storage
    // Convert Buffer to Blob (Node.js Blob from 'buffer' module)
    const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
    // Type assertion needed due to Node.js Blob vs Web Blob type mismatch
    const fileUrl = await fal.storage.upload(audioBlob as any);
    console.log('File uploaded to fal.ai storage:', fileUrl);

    // Call Whisper model for transcription with 60-second timeout
    let result;
    try {
      result = await withTimeout(
        fal.subscribe("fal-ai/whisper", {
          input: {
            audio_url: fileUrl,
            task: "transcribe",
            language: "en", // Can be made dynamic based on user preference
            chunk_level: "segment",
            version: "3"
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              console.log('Transcription in progress...');
            }
          },
        }),
        60000,
        'Audio Transcription'
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        console.error('[Transcribe] Request timed out after 60 seconds');
        return NextResponse.json(
          {
            error: 'Transcription timed out',
            message: 'The audio file took too long to transcribe. Please try with a shorter audio file.',
          },
          { status: 408 }
        );
      }
      throw error; // Re-throw non-timeout errors
    }

    console.log('Transcription completed:', result);

    // Extract transcript text (result is of type 'any' from fal.subscribe)
    const whisperResult = result as any;
    const transcript = whisperResult.text || '';
    const segments = whisperResult.chunks || [];
    const duration = whisperResult.duration || 0;
    const language = whisperResult.language || 'en';

    // Check if auto-save is requested
    const { searchParams } = new URL(request.url);
    const shouldSave = searchParams.get('save') === 'true';
    let transcriptId: string | undefined;

    if (shouldSave) {
      try {
        transcriptId = await saveTranscript(user.userId, {
          title: `Transcript - ${file.name}`,
          transcript,
          audioFileName: file.name,
          duration,
          language,
        });
        console.log('Transcript auto-saved:', transcriptId);
      } catch (saveError) {
        console.error('Failed to auto-save transcript:', saveError);
        // Continue even if save fails - still return the transcript
      }
    }

    return NextResponse.json({
      success: true,
      transcript,
      transcriptId, // Included if auto-saved
      segments,
      metadata: {
        duration,
        language,
        audioFileName: file.name,
      }
    });

  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      {
        error: 'Transcription failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}
