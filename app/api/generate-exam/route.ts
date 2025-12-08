/**
 * Exam Generation API
 * POST: Generate mock exam based on analysis and selected materials
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/middleware/authMiddleware'
import { getMaterialById } from '@/lib/firestore/materialRepository'
import * as Sentry from '@sentry/nextjs'
import { withTimeout } from '@/lib/utils/timeout'

interface ExamAnalysis {
  questionTypes: string[]
  questionCount: Record<string, number>
  difficulty: string
  topicDistribution: Record<string, number>
  formattingStyle: string
  totalQuestions: number
}

/**
 * POST /api/generate-exam
 * Body: {
 *   examAnalysis: ExamAnalysis,
 *   materialIds: string[],
 *   questionCount: number,
 *   includeAnswerKey: boolean
 * }
 */
export async function POST(request: NextRequest) {
  const span = Sentry.startSpan({ name: 'generate-exam' }, async () => {
    try {
      // Verify authentication
      const user = await verifyUserAuth(request)
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const body = await request.json()

      // Validate request
      if (!body.examAnalysis || !body.materialIds || !Array.isArray(body.materialIds)) {
        return NextResponse.json(
          { error: 'Missing or invalid request parameters' },
          { status: 400 }
        )
      }

      if (body.materialIds.length < 2 || body.materialIds.length > 5) {
        return NextResponse.json(
          { error: 'Please select between 2 and 5 materials' },
          { status: 400 }
        )
      }

      const {
        examAnalysis,
        materialIds,
        questionCount = 10,
        includeAnswerKey = true,
      }: {
        examAnalysis: ExamAnalysis
        materialIds: string[]
        questionCount: number
        includeAnswerKey: boolean
      } = body

      // Validate question count
      if (questionCount < 5 || questionCount > 50) {
        return NextResponse.json(
          { error: 'Question count must be between 5 and 50' },
          { status: 400 }
        )
      }

      // Fetch all selected materials
      const materials = await Promise.all(
        materialIds.map(id => getMaterialById(id, user.userId))
      )

      // Filter out any null materials (not found or unauthorized)
      const validMaterials = materials.filter(m => m !== null)

      if (validMaterials.length < 2) {
        return NextResponse.json(
          { error: 'Could not access the selected materials' },
          { status: 404 }
        )
      }

      // Combine material content
      let combinedContent = ''
      for (const material of validMaterials) {
        combinedContent += `\n\n=== MATERIAL: ${material.title} ===\n`
        combinedContent += material.content || ''
      }

      // Check total context size (rough estimate)
      const estimatedTokens = combinedContent.length / 4
      if (estimatedTokens > 100000) {
        return NextResponse.json(
          { error: 'Selected materials are too large. Please select fewer or shorter materials.' },
          { status: 400 }
        )
      }

      // Use Gemini to generate exam
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

      // Use Gemini Pro for better quality exam generation
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

      const prompt = `You are an expert exam creator. Generate a mock exam that matches the following style analysis:

STYLE ANALYSIS:
${JSON.stringify(examAnalysis, null, 2)}

STUDY MATERIALS TO USE:
${combinedContent}

REQUIREMENTS:
- Generate exactly ${questionCount} questions
- Match the question types distribution: ${JSON.stringify(examAnalysis.questionCount)}
- Match the difficulty level: ${examAnalysis.difficulty}
- Use the formatting style: ${examAnalysis.formattingStyle}
- Use ONLY information from the provided study materials
- Questions should be clear, unambiguous, and educational
- For MCQ questions, provide 4 options (A, B, C, D)
- For true/false questions, provide (True/False)
- For short-answer questions, provide expected answer length
${includeAnswerKey ? '- Include correct answers and brief explanations' : '- Do NOT include correct answers'}

Return your response as a JSON object with this structure:
{
  "title": "Mock Exam Title",
  "instructions": "Exam instructions for students",
  "questions": [
    {
      "id": 1,
      "type": "MCQ",
      "question": "Question text?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A",
      "explanation": "Why this is correct",
      "points": 1
    },
    {
      "id": 2,
      "type": "true-false",
      "question": "Statement to evaluate",
      "options": ["True", "False"],
      "correctAnswer": "True",
      "explanation": "Explanation",
      "points": 1
    },
    {
      "id": 3,
      "type": "short-answer",
      "question": "Question requiring brief answer?",
      "expectedLength": "2-3 sentences",
      "correctAnswer": "Expected answer",
      "explanation": "Key points to include",
      "points": 2
    }
  ],
  "totalPoints": ${questionCount},
  "estimatedTime": "60 minutes"
}

IMPORTANT: Return ONLY valid JSON, no other text or markdown.`

      const generationPromise = model.generateContent(prompt)

      // Apply 60s timeout
      const result: any = await withTimeout(generationPromise, 60000)
      const response = result.response
      let examText = response.text()

      // Clean up response - remove markdown code blocks if present
      examText = examText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      // Parse JSON response
      let exam: any
      try {
        exam = JSON.parse(examText)
      } catch (parseError) {
        console.error('Failed to parse AI response:', examText)
        throw new Error('AI returned invalid JSON response')
      }

      // Validate exam structure
      if (!exam.questions || !Array.isArray(exam.questions)) {
        throw new Error('AI response missing questions array')
      }

      // If answer key should not be included, remove answers
      if (!includeAnswerKey) {
        exam.questions = exam.questions.map((q: any) => ({
          ...q,
          correctAnswer: undefined,
          explanation: undefined,
        }))
      }

      return NextResponse.json({
        exam,
        metadata: {
          generatedAt: new Date().toISOString(),
          materialsUsed: validMaterials.length,
          materialTitles: validMaterials.map(m => m.title),
          questionCount: exam.questions.length,
          includeAnswerKey,
        },
      })

    } catch (error: any) {
      console.error('Exam generation error:', error)
      Sentry.captureException(error)

      if (error.message === 'Request timeout') {
        return NextResponse.json(
          { error: 'Exam generation took too long. Please try with fewer materials.' },
          { status: 408 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to generate exam' },
        { status: 500 }
      )
    }
  })

  return span
}
