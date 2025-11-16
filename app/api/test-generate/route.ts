import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// System context for better prompt engineering
const SYSTEM_CONTEXT = `You are an expert educational AI assistant specializing in creating high-quality study materials for university students. Your outputs should be:
- Academically rigorous yet accessible
- Formatted in clear, structured markdown
- Tailored to the student's learning objectives
- Based strictly on the provided lecture content
- Comprehensive and practical for exam preparation`;

// Professional prompt templates following best practices:
// [ROLE] → [CONTEXT] → [TASK] → [FORMAT] → [CONSTRAINTS]
const PROMPTS = {
  exam: (transcript: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: You have received a lecture transcript on an academic topic.

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

**LECTURE TRANSCRIPT**:
${transcript}`,

  summary: (transcript: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: You have received a lecture transcript that needs to be summarized at multiple levels of detail.

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

**LECTURE TRANSCRIPT**:
${transcript}`,

  quiz: (transcript: string) => `${SYSTEM_CONTEXT}

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

**LECTURE TRANSCRIPT**:
${transcript}`,

  'mock-exam': (transcript: string) => `${SYSTEM_CONTEXT}

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

**LECTURE TRANSCRIPT**:
${transcript}`,

  explain: (transcript: string) => `${SYSTEM_CONTEXT}

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

**LECTURE TRANSCRIPT**:
${transcript}`,

  custom: (transcript: string, customPrompt: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: You have received a lecture transcript and a specific request from a student.

**STUDENT'S REQUEST**:
${customPrompt}

**TASK**: Fulfill the student's request based on the lecture content provided.

**GUIDELINES**:
- Address the specific request directly
- Use appropriate formatting for readability
- Be thorough but focused on what was requested
- If the request is unclear, interpret it generously to provide maximum value
- Maintain academic rigor and accuracy

**LECTURE TRANSCRIPT**:
${transcript}

**OUTPUT**:
[Provide the requested content below]`,
};

export async function POST(request: NextRequest) {
  try {
    const { transcript, outputType, customPrompt } = await request.json();

    // Validation
    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    if (!outputType || !['exam', 'summary', 'quiz', 'mock-exam', 'explain', 'custom'].includes(outputType)) {
      return NextResponse.json(
        { error: 'Invalid output type' },
        { status: 400 }
      );
    }

    if (outputType === 'custom' && (!customPrompt || customPrompt.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Custom prompt is required for custom output type' },
        { status: 400 }
      );
    }

    // Generate prompt
    let prompt: string;
    if (outputType === 'custom') {
      prompt = PROMPTS.custom(transcript, customPrompt);
    } else {
      // Type-safe access to non-custom prompt generators (all take 1 argument)
      type NonCustomMaterialType = Exclude<keyof typeof PROMPTS, 'custom'>;
      const promptGenerator = PROMPTS[outputType as NonCustomMaterialType];
      if (typeof promptGenerator === 'function') {
        prompt = promptGenerator(transcript);
      } else {
        throw new Error('Invalid prompt generator');
      }
    }

    // Log prompt for debugging (visible in server console)
    console.log('='.repeat(80));
    console.log('GEMINI PROMPT SENT:');
    console.log('='.repeat(80));
    console.log(prompt);
    console.log('='.repeat(80));

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    // Log response for debugging
    console.log('='.repeat(80));
    console.log('GEMINI RESPONSE:');
    console.log('='.repeat(80));
    console.log(content.substring(0, 500) + '...');
    console.log('='.repeat(80));

    return NextResponse.json({
      content,
      outputType,
      promptUsed: prompt.substring(0, 200) + '...', // Return truncated prompt for reference
    });

  } catch (error: any) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
