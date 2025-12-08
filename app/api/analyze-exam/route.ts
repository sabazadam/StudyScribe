/**
 * Exam Analysis API
 * POST: Analyze exam structure and question types using AI
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/middleware/authMiddleware'
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
 * POST /api/analyze-exam
 * Body: { examText: string }
 */
export async function POST(request: NextRequest) {
  const span = Sentry.startSpan({ name: 'analyze-exam' }, async () => {
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

      if (!body.examText || typeof body.examText !== 'string') {
        return NextResponse.json(
          { error: 'Missing or invalid examText' },
          { status: 400 }
        )
      }

      const { examText } = body

      // Validate exam text length
      if (examText.length < 100) {
        return NextResponse.json(
          { error: 'Exam text is too short to analyze' },
          { status: 400 }
        )
      }

      // Use Gemini to analyze exam structure
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

      // Use Gemini Flash for cost-effective analysis
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' })

      const prompt = `Analyze the following exam and extract its structural characteristics.

EXAM TEXT:
${examText}

Provide your analysis as a JSON object with this exact structure:
{
  "questionTypes": ["MCQ", "true-false", "short-answer", "essay", "fill-in-blank"],
  "questionCount": {
    "MCQ": 10,
    "true-false": 5,
    "short-answer": 3
  },
  "difficulty": "easy|medium|hard",
  "topicDistribution": {
    "Topic 1": 5,
    "Topic 2": 8,
    "Topic 3": 3
  },
  "formattingStyle": "academic|casual|technical",
  "totalQuestions": 16
}

IMPORTANT INSTRUCTIONS:
- Identify ALL question types present in the exam
- Count how many questions of each type
- Assess overall difficulty level
- Identify main topics and count questions per topic
- Describe the formatting/writing style
- Calculate total number of questions
- Return ONLY valid JSON, no other text`

      const analysisPromise = model.generateContent(prompt)

      // Apply 60s timeout
      const result: any = await withTimeout(analysisPromise, 60000)
      const response = result.response
      let analysisText = response.text()

      // Clean up response - remove markdown code blocks if present
      analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      // Parse JSON response
      let analysis: ExamAnalysis
      try {
        analysis = JSON.parse(analysisText)
      } catch (parseError) {
        console.error('Failed to parse AI response:', analysisText)
        throw new Error('AI returned invalid JSON response')
      }

      // Validate required fields
      if (!analysis.questionTypes || !analysis.totalQuestions) {
        throw new Error('AI response missing required fields')
      }

      // Ensure defaults
      analysis.questionTypes = analysis.questionTypes || []
      analysis.questionCount = analysis.questionCount || {}
      analysis.difficulty = analysis.difficulty || 'medium'
      analysis.topicDistribution = analysis.topicDistribution || {}
      analysis.formattingStyle = analysis.formattingStyle || 'academic'
      analysis.totalQuestions = analysis.totalQuestions || 10

      return NextResponse.json({ analysis })

    } catch (error: any) {
      console.error('Exam analysis error:', error)
      Sentry.captureException(error)

      if (error.message === 'Request timeout') {
        return NextResponse.json(
          { error: 'Exam analysis took too long. Please try again.' },
          { status: 408 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to analyze exam structure' },
        { status: 500 }
      )
    }
  })

  return span
}
