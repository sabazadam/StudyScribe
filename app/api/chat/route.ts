import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getModelById, type ModelTier } from '@/lib/models';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, transcript, studyMaterials, conversationHistory, modelTier } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'No question provided' },
        { status: 400 }
      );
    }

    if (!transcript && !studyMaterials) {
      return NextResponse.json(
        { error: 'No context provided. Need transcript or study materials.' },
        { status: 400 }
      );
    }

    // Get the appropriate model based on user selection
    const selectedModel = getModelById((modelTier as ModelTier) || 'default');
    console.log('Using model:', selectedModel, 'for chat');
    const model = genAI.getGenerativeModel({ model: selectedModel });

    // Build context-aware prompt
    let contextPrompt = `You are a helpful educational assistant. A student is asking a follow-up question about their lecture materials.\n\n`;

    if (transcript) {
      contextPrompt += `Original Lecture Transcript:\n${transcript}\n\n`;
    }

    if (studyMaterials) {
      contextPrompt += `Generated Study Materials:\n${studyMaterials}\n\n`;
    }

    if (conversationHistory && conversationHistory.length > 0) {
      contextPrompt += `Previous Conversation:\n`;
      conversationHistory.forEach((msg: any) => {
        contextPrompt += `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.content}\n`;
      });
      contextPrompt += `\n`;
    }

    contextPrompt += `Student's Question: ${question}\n\nProvide a clear, helpful answer based on the lecture content. If the question is about something not covered in the materials, politely let them know and offer related information if possible.`;

    console.log('Processing follow-up question...');

    // Generate response
    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    const answer = response.text();

    console.log('Follow-up answer generated');

    return NextResponse.json({
      success: true,
      answer,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process question',
        details: error.message
      },
      { status: 500 }
    );
  }
}
