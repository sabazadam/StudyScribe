import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { mergeContexts, createEnhancedPrompt, validateContext } from '@/lib/contextMerger';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// System context for better prompt engineering
const SYSTEM_CONTEXT = `You are an expert educational AI assistant specializing in creating high-quality study materials for university students. Your outputs should be:
- Academically rigorous yet accessible
- Formatted in clear, structured markdown
- Tailored to the student's learning objectives
- Based strictly on the provided lecture content
- Comprehensive and practical for exam preparation`;

// Professional prompt templates following best practices
// Structure: [ROLE] → [CONTEXT] → [TASK] → [FORMAT] → [CONSTRAINTS]
// Note: These prompts now work with merged content from multiple sources
const PROMPTS = {
  exam: (content: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: You have received comprehensive lecture materials from multiple sources.

**TASK**: Create comprehensive exam preparation materials that help students master the content.

**FORMAT**: Generate the following sections:

# 📚 Study Material for Exam

## Overview
[2-3 sentence summary of the main topic and its importance]

## Key Concepts & Definitions
[List and explain all critical concepts, terms, and definitions that students must memorize]

## Important Formulas/Equations
[If applicable, list all formulas with explanations of variables and when to use them]

## Core Principles & Theories
[Explain the fundamental principles, theories, or frameworks covered]

## Common Exam Questions & Answers
[Provide 5-7 typical exam questions with detailed model answers]

## Must-Know Facts
[Bullet list of 10-15 essential facts that frequently appear on exams]

## Study Tips & Common Mistakes
[Advice on how to study this material and mistakes to avoid]

## Quick Review Checklist
[Checklist format: "I can explain/calculate/describe..." items]

**CONSTRAINTS**:
- Focus on exam-relevant content only
- Make it practical and actionable
- Include specific examples from the lecture
- Use clear, structured markdown formatting

**LECTURE CONTENT**:
${content}`,

  summary: (content: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: You have received comprehensive lecture content that needs to be summarized at multiple levels of detail.

**TASK**: Create a multi-level summary that serves different study needs.

**FORMAT**: Generate the following:

# 📝 Content Summary

## Executive Summary (30 seconds)
[1-2 sentences capturing the absolute essence]

## Brief Overview (2 minutes)
[1 paragraph covering main topic, key points, and significance]

## Detailed Breakdown (5-10 minutes)
[3-5 paragraphs with:
- Introduction to the topic
- Main concepts explained
- Supporting details and examples
- Connections between ideas
- Conclusions or implications]

## Key Takeaways
[Bullet list of 5-7 most important points to remember]

## Topic Structure
[Hierarchical outline showing how concepts relate:
- Main Topic
  - Subtopic 1
    - Detail A
    - Detail B
  - Subtopic 2
    ...]

**CONSTRAINTS**:
- Each level should be self-contained
- Progress from high-level to detailed
- Maintain accuracy at all levels
- Use clear transitions between ideas

**LECTURE CONTENT**:
${content}`,

  quiz: (content: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: You need to create a comprehensive quiz to test student understanding of the lecture content.

**TASK**: Generate a well-balanced quiz with multiple question types.

**FORMAT**:

# 📝 Practice Quiz

## Part 1: Multiple Choice (5 questions)
[For each question:
1. Question text
   A) Option 1
   B) Option 2
   C) Option 3
   D) Option 4

   **Correct Answer**: [Letter]
   **Explanation**: [Why this is correct and others are wrong]]

## Part 2: True/False (5 questions)
[For each:
Statement: [Text]
**Answer**: [True/False]
**Explanation**: [Why and what makes it true/false]]

## Part 3: Short Answer (3 questions)
[For each:
**Question**: [Text]
**Model Answer**: [2-3 sentences with key points that should be included]]

## Part 4: Application/Analysis (2 questions)
[Scenario-based or case study questions requiring deeper thinking:
**Question**: [Complex scenario]
**Model Answer**: [Detailed response showing application of concepts]]

## Answer Key Summary
[Quick reference with just question numbers and answers]

**CONSTRAINTS**:
- Questions should test different cognitive levels (recall, understanding, application, analysis)
- Cover all major topics from the lecture
- Avoid trick questions
- Provide educational explanations for each answer

**LECTURE CONTENT**:
${content}`,

  'mock-exam': (content: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: Students need a realistic practice exam to simulate actual testing conditions.

**TASK**: Create a full mock exam that mirrors real exam structure and difficulty.

**FORMAT**:

# 📋 Mock Exam

## Exam Instructions
**Time Allowed**: [Estimate based on content, e.g., 90 minutes]
**Total Points**: 100
**Passing Grade**: 60%

**Instructions**:
- Read all questions carefully
- Show your work for calculation questions
- Manage your time wisely across sections

---

## Section A: Multiple Choice (30 points - 2 points each)
[15 questions with 4 options each, covering breadth of material]

## Section B: Short Answer (30 points - 6 points each)
[5 questions requiring paragraph responses]

## Section C: Problem Solving/Analysis (25 points)
[2-3 complex questions requiring detailed work, calculations, or deep analysis]

## Section D: Essay/Synthesis (15 points)
[1 question requiring integration of multiple concepts]

---

## Answer Key with Grading Rubric

[For each question:
- Correct answer
- Point allocation
- Grading criteria (what earns full/partial/no credit)
- Common mistakes to watch for]

## Performance Analysis
**Score Interpretation**:
- 90-100: Excellent mastery
- 80-89: Good understanding
- 70-79: Satisfactory
- 60-69: Passing, needs review
- Below 60: Requires significant study

**Recommended Study Areas by Question**:
[If you missed questions X-Y, review topic Z]

**CONSTRAINTS**:
- Questions should match typical university exam difficulty
- Include time-management guidance
- Cover all major topics proportionally
- Provide detailed grading rubrics

**LECTURE CONTENT**:
${content}`,

  explain: (content: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: Students need step-by-step explanations to build understanding from fundamentals to advanced concepts.

**TASK**: Break down the lecture content into logical, sequential explanations.

**APPROACH**: First, analyze the transcript to:
1. Identify all main concepts
2. Determine prerequisite knowledge
3. Order concepts by dependency (what must be understood first)
4. Then provide structured explanations

**FORMAT**:

# 🎯 Part-by-Part Explanation

## Learning Path
[Show the order concepts will be explained and why:
Foundation → Building Blocks → Advanced Concepts → Applications]

---

## Part 1: [First Concept Name]

### What is it?
[Clear definition in simple terms]

### Why does it matter?
[Context and importance - why are we learning this?]

### How does it work?
[Detailed explanation of mechanism, process, or logic]

### Example
[Concrete example from the lecture or analogous situation]

### Common Confusion Points
[What students often misunderstand and clarification]

### Check Your Understanding
[1-2 quick questions to verify comprehension before moving on]

---

## Part 2: [Second Concept Name]
[Same structure as Part 1]

[Continue for all major concepts...]

---

## Concept Connections
[Diagram or explanation of how all parts relate to each other]

## Summary: Putting It All Together
[Synthesis showing how individual parts create the complete picture]

**CONSTRAINTS**:
- Use simple language before introducing technical terms
- Build complexity gradually
- Connect new information to previously explained concepts
- Include analogies or metaphors where helpful
- Assume motivated but not expert learners

**LECTURE CONTENT**:
${content}`,

  custom: (content: string, customPrompt: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: You have received comprehensive lecture content and a specific request from a student.

**STUDENT'S REQUEST**:
${customPrompt}

**TASK**: Fulfill the student's request based on the lecture content provided.

**GUIDELINES**:
- Address the specific request directly
- Use appropriate formatting for readability
- Be thorough but focused on what was requested
- If the request is unclear, interpret it generously to provide maximum value
- Maintain academic rigor and accuracy

**LECTURE CONTENT**:
${content}

**OUTPUT**:
[Provide the requested content below]`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, slideText, imageAnalysis, materialType, customPrompt } = body;

    // Check if at least one content source is provided
    if ((!transcript || transcript.trim().length === 0) &&
        (!slideText || slideText.trim().length === 0) &&
        (!imageAnalysis || imageAnalysis.trim().length === 0)) {
      return NextResponse.json(
        { error: 'At least one content source (transcript, slideText, or imageAnalysis) must be provided' },
        { status: 400 }
      );
    }

    // Merge all context sources
    console.log('Merging context sources...');
    console.log('- Transcript:', transcript ? `${transcript.length} chars` : 'none');
    console.log('- Slide text:', slideText ? `${slideText.length} chars` : 'none');
    console.log('- Image analysis:', imageAnalysis ? `${imageAnalysis.length} chars` : 'none');

    const mergedContext = mergeContexts({
      transcript: transcript || '',
      slideText: slideText || '',
      imageAnalysis: imageAnalysis || '',
    });

    // Validate context
    const validation = validateContext({
      transcript: transcript || '',
      slideText: slideText || '',
      imageAnalysis: imageAnalysis || ''
    });
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      );
    }

    console.log('Context merged successfully:');
    console.log('- Total words:', mergedContext.stats.totalWords);
    console.log('- Sources:', Object.entries(mergedContext.sources).filter(([_, v]) => v).map(([k]) => k).join(', '));

    if (!materialType || !['exam', 'summary', 'quiz', 'mock-exam', 'explain', 'custom'].includes(materialType)) {
      return NextResponse.json(
        { error: 'Invalid material type. Must be: exam, summary, quiz, mock-exam, explain, or custom' },
        { status: 400 }
      );
    }

    // Validate custom prompt if needed
    if (materialType === 'custom' && (!customPrompt || customPrompt.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Custom prompt is required for custom material type' },
        { status: 400 }
      );
    }

    // Get the appropriate model (using Gemini 2.0 Flash Exp for latest features)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build the prompt using merged content
    let basePrompt: string;
    if (materialType === 'custom') {
      basePrompt = PROMPTS.custom(mergedContext.combinedContent, customPrompt);
    } else {
      // Type-safe access to non-custom prompt generators (all take 1 argument)
      type NonCustomMaterialType = Exclude<keyof typeof PROMPTS, 'custom'>;
      const promptGenerator = PROMPTS[materialType as NonCustomMaterialType];
      if (typeof promptGenerator === 'function') {
        basePrompt = promptGenerator(mergedContext.combinedContent);
      } else {
        throw new Error('Invalid prompt generator');
      }
    }

    // Enhance the prompt with multi-source instructions
    const prompt = createEnhancedPrompt(basePrompt, mergedContext);

    console.log('Generating materials with Gemini...');
    console.log('Material Type:', materialType);
    if (materialType === 'custom') {
      console.log('Custom Request:', customPrompt);
    }

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    console.log('Materials generated successfully');

    return NextResponse.json({
      success: true,
      content: generatedText,
      materialType,
      timestamp: new Date().toISOString(),
      sources: mergedContext.sources,
      stats: mergedContext.stats
    });

  } catch (error: any) {
    console.error('Material generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate study materials',
        details: error.message
      },
      { status: 500 }
    );
  }
}
