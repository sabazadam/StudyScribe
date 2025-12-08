/**
 * Exam PDF Export API
 * POST: Export generated exam as a professional PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/middleware/authMiddleware'
import * as Sentry from '@sentry/nextjs'

/**
 * POST /api/export-exam-pdf
 * Body: {
 *   exam: object,
 *   includeAnswerKey: boolean
 * }
 */
export async function POST(request: NextRequest) {
  const span = Sentry.startSpan({ name: 'export-exam-pdf' }, async () => {
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

      if (!body.exam || !body.exam.questions) {
        return NextResponse.json(
          { error: 'Missing or invalid exam data' },
          { status: 400 }
        )
      }

      const { exam, includeAnswerKey = false } = body

      // Generate HTML content for the exam
      const htmlContent = generateExamHTML(exam, includeAnswerKey)

      // For MVP, we'll return HTML that can be printed as PDF
      // In production, you might want to use a library like puppeteer or jsPDF
      // For now, we'll use a simple approach: return HTML with print styles

      // Create a buffer from the HTML
      const buffer = Buffer.from(htmlContent, 'utf-8')

      // Return as downloadable HTML file with print styles
      // Users can open and print to PDF
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="mock-exam-${Date.now()}.html"`,
        },
      })

    } catch (error: any) {
      console.error('PDF export error:', error)
      Sentry.captureException(error)

      return NextResponse.json(
        { error: 'Failed to export exam as PDF' },
        { status: 500 }
      )
    }
  })

  return span
}

/**
 * Generate professional HTML for exam
 */
function generateExamHTML(exam: any, includeAnswerKey: boolean): string {
  const { title, instructions, questions, totalPoints, estimatedTime } = exam

  let questionsHTML = ''
  let answerKeyHTML = ''

  questions.forEach((q: any, index: number) => {
    const questionNumber = index + 1

    // Question HTML
    questionsHTML += `
      <div class="question">
        <div class="question-header">
          <span class="question-number">Question ${questionNumber}</span>
          <span class="question-points">(${q.points || 1} point${q.points !== 1 ? 's' : ''})</span>
        </div>
        <div class="question-text">${q.question}</div>
    `

    if (q.options && q.options.length > 0) {
      questionsHTML += '<div class="options">'
      q.options.forEach((option: string) => {
        questionsHTML += `<div class="option">${option}</div>`
      })
      questionsHTML += '</div>'
    }

    if (q.expectedLength) {
      questionsHTML += `<div class="expected-length">Expected length: ${q.expectedLength}</div>`
    }

    questionsHTML += '</div>' // Close question div

    // Answer key HTML (separate section)
    if (includeAnswerKey && q.correctAnswer) {
      answerKeyHTML += `
        <div class="answer-item">
          <strong>Question ${questionNumber}:</strong> ${q.correctAnswer}
          ${q.explanation ? `<div class="explanation">${q.explanation}</div>` : ''}
        </div>
      `
    }
  })

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Mock Exam'}</title>
  <style>
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none;
      }
      .page-break {
        page-break-before: always;
      }
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      background: white;
    }

    .header {
      text-align: center;
      margin-bottom: 2em;
      border-bottom: 2px solid #333;
      padding-bottom: 1em;
    }

    .header h1 {
      font-size: 24pt;
      margin: 0 0 0.5em 0;
      color: #034078;
    }

    .exam-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1em;
      font-size: 11pt;
    }

    .instructions {
      background: #f5f5f5;
      padding: 1em;
      margin-bottom: 2em;
      border-left: 4px solid #034078;
    }

    .instructions h2 {
      margin-top: 0;
      font-size: 14pt;
      color: #034078;
    }

    .question {
      margin-bottom: 2em;
      page-break-inside: avoid;
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5em;
      font-weight: bold;
    }

    .question-number {
      color: #034078;
      font-size: 12pt;
    }

    .question-points {
      color: #666;
      font-size: 10pt;
    }

    .question-text {
      font-size: 11pt;
      margin-bottom: 0.75em;
      font-weight: 500;
    }

    .options {
      margin-left: 1em;
    }

    .option {
      margin-bottom: 0.5em;
      font-size: 10.5pt;
    }

    .expected-length {
      font-size: 9pt;
      color: #666;
      font-style: italic;
      margin-top: 0.5em;
    }

    .answer-key {
      margin-top: 3em;
      padding-top: 2em;
      border-top: 2px solid #333;
    }

    .answer-key h2 {
      color: #034078;
      font-size: 18pt;
      margin-bottom: 1em;
    }

    .answer-item {
      margin-bottom: 1em;
      padding: 0.5em;
      background: #f9f9f9;
      border-left: 3px solid #034078;
    }

    .explanation {
      margin-top: 0.5em;
      font-size: 10pt;
      color: #555;
      font-style: italic;
    }

    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #034078;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    }

    .print-button:hover {
      background: #023055;
    }

    @page {
      margin: 0.5in;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>

  <div class="header">
    <h1>${title || 'Mock Examination'}</h1>
    <div class="exam-info">
      <div>Total Points: ${totalPoints || questions.length}</div>
      <div>Estimated Time: ${estimatedTime || 'N/A'}</div>
    </div>
  </div>

  ${instructions ? `
  <div class="instructions">
    <h2>Instructions</h2>
    <p>${instructions}</p>
  </div>
  ` : ''}

  <div class="questions">
    ${questionsHTML}
  </div>

  ${includeAnswerKey && answerKeyHTML ? `
  <div class="answer-key page-break">
    <h2>Answer Key</h2>
    ${answerKeyHTML}
  </div>
  ` : ''}

  <script>
    // Auto-print dialog on load (optional)
    // window.onload = () => setTimeout(() => window.print(), 500);
  </script>
</body>
</html>
  `.trim()
}
