/**
 * PDF Text Extraction API
 * POST: Extract text from PDF file for exam analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/middleware/authMiddleware'
import * as Sentry from '@sentry/nextjs'
import { withTimeout } from '@/lib/utils/timeout'

/**
 * POST /api/extract-pdf
 * Body: FormData with 'pdf' file
 */
export async function POST(request: NextRequest) {
  const span = Sentry.startSpan({ name: 'extract-pdf' }, async () => {
    try {
      // Verify authentication
      const user = await verifyUserAuth(request)
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Get the PDF file from form data
      const formData = await request.formData()
      const pdfFile = formData.get('pdf') as File

      if (!pdfFile) {
        return NextResponse.json(
          { error: 'No PDF file provided' },
          { status: 400 }
        )
      }

      // Validate file type
      if (pdfFile.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'File must be a PDF' },
          { status: 400 }
        )
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (pdfFile.size > maxSize) {
        return NextResponse.json(
          { error: 'PDF file size must be less than 10MB' },
          { status: 400 }
        )
      }

      // Convert PDF to buffer
      const buffer = Buffer.from(await pdfFile.arrayBuffer())

      // For now, we'll use a simple text extraction approach
      // In production, you might want to use pdf-parse or similar library
      // For MVP, we'll use Gemini's vision capabilities to extract text
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

      // Use Gemini Flash for cost-effective text extraction
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' })

      // Convert buffer to base64 for Gemini
      const base64Pdf = buffer.toString('base64')

      const prompt = `Extract all text content from this PDF exam document.
Return ONLY the raw text content without any formatting, analysis, or additional commentary.
Include all questions, answers, instructions, and any other text visible in the document.`

      const extractionPromise = model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Pdf,
          },
        },
        { text: prompt },
      ])

      // Apply 60s timeout
      const result: any = await withTimeout(extractionPromise, 60000)
      const response = result.response
      const extractedText = response.text()

      if (!extractedText || extractedText.length < 100) {
        return NextResponse.json(
          { error: 'Could not extract meaningful text from PDF. Please ensure the PDF contains readable text.' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        text: extractedText,
        wordCount: extractedText.split(/\s+/).length,
        characterCount: extractedText.length,
      })

    } catch (error: any) {
      console.error('PDF extraction error:', error)
      Sentry.captureException(error)

      if (error.message === 'Request timeout') {
        return NextResponse.json(
          { error: 'PDF extraction took too long. Please try a smaller file.' },
          { status: 408 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to extract text from PDF' },
        { status: 500 }
      )
    }
  })

  return span
}
