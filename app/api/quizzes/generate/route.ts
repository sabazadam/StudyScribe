/**
 * Quiz Generation API
 * POST: Generate quiz from study material using Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createQuiz } from '@/lib/quizStorage';
import { QuizQuestion } from '@/lib/quizTypes';
import { getModelById, type ModelTier } from '@/lib/models';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const QUIZ_GENERATION_PROMPT = (content: string, questionCount: number, difficulty: string) => `You are an expert educational AI assistant specializing in creating high-quality quiz questions for university students.

**TASK**: Create a multiple-choice quiz with exactly ${questionCount} questions based on the following study material.

**REQUIREMENTS**:
1. Each question must have exactly 4-5 answer options
2. Only ONE option should be correct
3. Include a detailed explanation for why the correct answer is right AND why other options are wrong
4. Difficulty level: ${difficulty}
5. Questions should test understanding, not just memorization
6. Cover different topics from the material

**OUTPUT FORMAT**: You MUST respond with ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):

{
  "questions": [
    {
      "question": "Clear, specific question text here?",
      "options": [
        "Option A text",
        "Option B text",
        "Option C text",
        "Option D text"
      ],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why option A is correct and why B, C, D are incorrect. Be specific and educational.",
      "difficulty": "${difficulty}"
    }
  ]
}

**STUDY MATERIAL**:
${content}

Generate exactly ${questionCount} questions following the format above. Respond ONLY with the JSON object, nothing else.`;

/**
 * POST /api/quizzes/generate
 * Body: {
 *   materialId?: string,
 *   content: string,
 *   title: string,
 *   questionCount?: number (default: 10),
 *   difficulty?: 'easy' | 'medium' | 'hard' (default: 'medium'),
 *   timeLimit?: number,
 *   modelTier?: 'default' | 'better' | 'star'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.content || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: content, title' },
        { status: 400 }
      );
    }

    const questionCount = body.questionCount || 10;
    const difficulty = body.difficulty || 'medium';
    const modelTier: ModelTier = body.modelTier || 'better'; // Use pro model for better quality

    // Validate question count
    if (questionCount < 1 || questionCount > 50) {
      return NextResponse.json(
        { error: 'Question count must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Difficulty must be easy, medium, or hard' },
        { status: 400 }
      );
    }

    // Generate quiz using Gemini
    const model = genAI.getGenerativeModel({
      model: getModelById(modelTier),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8000,
      },
    });

    const prompt = QUIZ_GENERATION_PROMPT(body.content, questionCount, difficulty);

    console.log('Generating quiz with Gemini...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('Raw Gemini response:', text.substring(0, 200));

    // Parse the response
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Response text:', text);
      return NextResponse.json(
        {
          error: 'Failed to parse AI response. Please try again.',
          details: 'The AI generated an invalid format. This usually resolves by retrying.'
        },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    // Validate and format questions
    const validatedQuestions: QuizQuestion[] = parsedResponse.questions.map((q: any, index: number) => {
      // Ensure all required fields exist
      if (!q.question || !q.options || !Array.isArray(q.options) || q.correctAnswer === undefined || !q.explanation) {
        throw new Error(`Invalid question format at index ${index}`);
      }

      // Ensure correct answer is valid index
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        throw new Error(`Invalid correct answer index at question ${index}`);
      }

      return {
        id: `q-${Date.now()}-${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty || difficulty,
        order: index,
      };
    });

    // Verify we got the requested number of questions
    if (validatedQuestions.length !== questionCount) {
      console.warn(`Requested ${questionCount} questions but got ${validatedQuestions.length}`);
    }

    // Create the quiz
    const newQuiz = createQuiz({
      title: body.title,
      description: body.description || `Auto-generated ${difficulty} quiz with ${validatedQuestions.length} questions`,
      questions: validatedQuestions,
      materialId: body.materialId,
      status: 'published',
      timeLimit: body.timeLimit,
      passingScore: body.passingScore,
      tags: body.tags || ['auto-generated', difficulty],
    });

    console.log(`Successfully generated quiz with ${validatedQuestions.length} questions`);

    return NextResponse.json({
      quiz: newQuiz,
      message: `Successfully generated ${validatedQuestions.length} questions`,
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
