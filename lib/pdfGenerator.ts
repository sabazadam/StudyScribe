import { jsPDF } from 'jspdf';

interface PDFOptions {
  title: string;
  content: string;
  subtitle?: string;
  materialType?: string;
  includeTimestamp?: boolean;
}

/**
 * Generate a professional PDF with proper markdown rendering using jsPDF
 * This implementation is server-compatible (no DOM dependencies)
 */
export async function generatePDF({
  title,
  content,
  subtitle,
  materialType,
  includeTimestamp = true
}: PDFOptions): Promise<void> {
  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let y = margin;

  // Helper function to check if we need a new page
  const checkPageBreak = (heightNeeded: number) => {
    if (y + heightNeeded > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Header section
  doc.setFillColor(147, 51, 234); // Purple accent
  doc.rect(margin, y, maxWidth, 3, 'F');
  y += 8;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(31, 41, 55); // Gray-800
  const titleLines = doc.splitTextToSize(title, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8;

  // Subtitle
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128); // Gray-500
    const subtitleLines = doc.splitTextToSize(subtitle, maxWidth);
    doc.text(subtitleLines, margin, y);
    y += subtitleLines.length * 5;
  }

  // Material Type
  if (materialType) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(147, 51, 234); // Purple-600
    doc.text(`Material Type: ${materialType}`, margin, y);
    y += 6;
  }

  // Timestamp
  if (includeTimestamp) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175); // Gray-400
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, y);
    y += 10;
  }

  // Divider line
  doc.setDrawColor(229, 231, 235); // Gray-200
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Reset text color for content
  doc.setTextColor(55, 65, 81); // Gray-700

  // Parse and render markdown content
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines (but add small spacing)
    if (!line.trim()) {
      y += 2;
      continue;
    }

    checkPageBreak(15);

    // H1 Headers (# )
    if (line.startsWith('# ')) {
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(17, 24, 39); // Gray-900
      const text = line.substring(2);
      const textLines = doc.splitTextToSize(text, maxWidth);
      doc.text(textLines, margin, y);
      y += textLines.length * 7 + 3;

      // Underline
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
      continue;
    }

    // H2 Headers (## )
    if (line.startsWith('## ')) {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55); // Gray-800
      const text = line.substring(3);
      const textLines = doc.splitTextToSize(text, maxWidth);
      doc.text(textLines, margin, y);
      y += textLines.length * 6 + 4;
      continue;
    }

    // H3 Headers (### )
    if (line.startsWith('### ')) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55); // Gray-800
      const text = line.substring(4);
      const textLines = doc.splitTextToSize(text, maxWidth);
      doc.text(textLines, margin, y);
      y += textLines.length * 5 + 3;
      continue;
    }

    // Horizontal rules (---)
    if (line.trim() === '---') {
      checkPageBreak(5);
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      continue;
    }

    // Code blocks (```)
    if (line.startsWith('```')) {
      checkPageBreak(10);
      // Collect code block content
      let codeContent = '';
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeContent += lines[i] + '\n';
        i++;
      }

      // Render code block with background
      doc.setFillColor(243, 244, 246); // Gray-100
      const codeLines = codeContent.split('\n').filter(l => l);
      const codeHeight = codeLines.length * 5 + 6;

      checkPageBreak(codeHeight);
      doc.roundedRect(margin, y - 2, maxWidth, codeHeight, 2, 2, 'F');

      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(147, 51, 234); // Purple

      let codeY = y + 3;
      for (const codeLine of codeLines) {
        const codeTextLines = doc.splitTextToSize(codeLine, maxWidth - 6);
        doc.text(codeTextLines, margin + 3, codeY);
        codeY += codeTextLines.length * 4.5;
      }

      y = codeY + 4;
      doc.setTextColor(55, 65, 81); // Reset color
      continue;
    }

    // Bullet points (- or *)
    if (line.match(/^[\*\-] /)) {
      checkPageBreak(10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const text = line.substring(2);
      const textLines = doc.splitTextToSize(text, maxWidth - 5);

      // Draw bullet
      doc.circle(margin + 1.5, y - 1, 0.8, 'F');

      // Draw text
      doc.text(textLines, margin + 5, y);
      y += textLines.length * 5 + 1;
      continue;
    }

    // Numbered lists (1. 2. etc.)
    const numberedMatch = line.match(/^(\d+)\. /);
    if (numberedMatch) {
      checkPageBreak(10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const number = numberedMatch[1];
      const text = line.substring(numberedMatch[0].length);
      const textLines = doc.splitTextToSize(text, maxWidth - 8);

      // Draw number
      doc.setFont('helvetica', 'bold');
      doc.text(`${number}.`, margin, y);

      // Draw text
      doc.setFont('helvetica', 'normal');
      doc.text(textLines, margin + 8, y);
      y += textLines.length * 5 + 1;
      continue;
    }

    // Blockquotes (> )
    if (line.startsWith('> ')) {
      checkPageBreak(10);
      doc.setDrawColor(59, 130, 246); // Blue-500
      doc.setLineWidth(1);
      doc.line(margin, y - 2, margin, y + 5);
      doc.setLineWidth(0.2);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // Gray-500
      const text = line.substring(2);
      const textLines = doc.splitTextToSize(text, maxWidth - 8);
      doc.text(textLines, margin + 6, y);
      y += textLines.length * 5 + 2;
      doc.setTextColor(55, 65, 81); // Reset color
      continue;
    }

    // Regular paragraphs
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);

    // Handle inline formatting (bold and italic - simplified)
    let processedLine = line;

    // Process the line with basic formatting
    const textLines = doc.splitTextToSize(processedLine, maxWidth);
    doc.text(textLines, margin, y);
    y += textLines.length * 5 + 2;
  }

  // Footer
  if (y < pageHeight - 30) {
    y = pageHeight - 25;
  } else {
    doc.addPage();
    y = pageHeight - 25;
  }

  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text('Generated by LectureHelper AI • Powered by Gemini', pageWidth / 2, y, { align: 'center' });

  // Generate filename
  const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;

  // Save PDF
  doc.save(filename);
}

// Helper function to download transcript as PDF
export async function downloadTranscriptPDF(transcript: string): Promise<void> {
  await generatePDF({
    title: 'Lecture Transcript',
    subtitle: 'Audio/Video Transcription',
    content: transcript
  });
}

// Helper function to download study materials as PDF
export async function downloadStudyMaterialsPDF(content: string, materialType: string): Promise<void> {
  const titles: Record<string, string> = {
    exam: 'Study Material for Exam',
    summary: 'Content Summary',
    quiz: 'Practice Quiz',
    'mock-exam': 'Mock Exam',
    explain: 'Part-by-Part Explanation',
    custom: 'Custom Study Material'
  };

  await generatePDF({
    title: titles[materialType] || 'Study Materials',
    subtitle: 'AI-Generated Educational Content',
    materialType: titles[materialType],
    content
  });
}
