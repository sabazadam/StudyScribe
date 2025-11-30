import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { mergeContexts, createEnhancedPrompt, validateContext } from '@/lib/contextMerger';
import { getModelById, type ModelTier } from '@/lib/models';
import {
  parseVisualMarkers,
  generateImageProposals,
  estimateEducationalLevel,
} from '@/lib/imageEnhancer';
import { MaterialImageData, ImageGenerationResponse } from '@/lib/types/image';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper function to generate unique material IDs
function generateMaterialId(): string {
  return `material_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// System context for better prompt engineering
const SYSTEM_CONTEXT = `You are an expert educational AI assistant specializing in creating high-quality, engaging study materials for university students. Your outputs should be:
- Academically rigorous yet accessible with storytelling elements
- Formatted in clear, structured markdown with visual enhancement markers
- Tailored to the student's learning objectives with interactive prompts
- Based strictly on the provided lecture content
- Comprehensive and practical for exam preparation with highlighted key concepts

**VISUAL ENHANCEMENT GUIDELINES**:
When concepts would benefit from visual aids, use this syntax: {{IMAGE:detailed description}}
- For processes/flows: {{IMAGE:flowchart showing [process] with labeled steps and arrows}}
- For hierarchies: {{IMAGE:tree diagram showing [classification/structure] with branches and categories}}
- For comparisons: {{IMAGE:side-by-side comparison of [A vs B] with key differences highlighted}}
- For systems/structures: {{IMAGE:diagram of [system name] with labeled components and connections}}
- For cycles: {{IMAGE:circular diagram showing [cycle name] with stages and transitions}}
- For relationships: {{IMAGE:concept map showing how [concepts] relate and interact}}

IMPORTANT: Maximum 2 images per material. Choose the MOST impactful concepts that need visualization.

**STORYTELLING & ENGAGEMENT**:
- Frame complex concepts as narratives or journeys
- Use analogies that connect to everyday experiences
- Build from familiar concepts to unfamiliar ones
- Create memorable mental models and frameworks
- Show real-world applications and implications

**KEY CONCEPT HIGHLIGHTING**:
- **Bold** for critical definitions and must-know terms
- *Italic* for important relationships and connections
- > Blockquotes for essential takeaways and core principles
- 📌 Emoji for marking absolutely crucial points (use sparingly)`;



// Professional prompt templates following best practices
// Structure: [ROLE] → [CONTEXT] → [TASK] → [FORMAT] → [CONSTRAINTS]
// Note: These prompts now work with merged content from multiple sources
const PROMPTS = {
  exam: (content: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: You have received comprehensive lecture materials from multiple sources.

**TASK**: Create comprehensive, visually-enhanced exam preparation materials that help students master the content through engaging explanations, clear visualizations, and interactive self-checks.

**VISUAL REQUIREMENTS**: Identify up to 2 concepts that would benefit most from diagrams (processes, hierarchies, or systems). Mark these with {{IMAGE:description}}.

**FORMAT**: Generate the following sections:

# 📚 Study Material for Exam

## Overview
[2-3 sentence story-style summary introducing the main topic, its real-world significance, and why it matters for the exam. Make it memorable and engaging.]

## Key Concepts & Definitions
[For each critical concept:
- **Term**: Clear definition in simple language
- *Why it matters*: Connection to bigger picture
- 💡 *Think of it as*: Memorable analogy or mental model
- Example from lecture

Use **bold** for all must-memorize terms. Add {{IMAGE:...}} for the MOST complex concept that needs visual explanation.]

## Important Formulas/Equations
[If applicable:
- List formulas with **bold** variable names
- Explain when and why to use each formula (tell a story about the problem it solves)
- Provide a worked example showing step-by-step application
- ⚠️ Common calculation mistakes to avoid

Consider: {{IMAGE:diagram showing formula components and how they relate}}]

## Core Principles & Theories
[For each principle:
- Frame as a narrative: "Imagine you're..." or "Think about what happens when..."
- Explain the **"why"** before the "what"
- Use analogies to everyday experiences
- Show how principles connect to each other
- > Blockquote the absolute key takeaway

Add {{IMAGE:...}} if principles form a system or hierarchy worth visualizing]

## Common Exam Questions & Answers
[Provide 5-7 typical exam questions organized by difficulty:

**Foundation Level** (Understanding):
Q: [Question]
A: [Model answer with **key terms bolded**]
*Why this answer works*: [Explanation]

**Application Level** (Problem-solving):
[Continue pattern...]

💡 *Pattern recognition tip*: Notice how these questions test [common pattern]]

## Must-Know Facts
[Organized by theme, not random list:

**Theme 1: [Topic Area]**
- 📌 [CRITICAL fact - appears on every exam]
- [Important fact with context]
- [Supporting fact]

**Theme 2: [Topic Area]**
[Continue...]

*Memory trick*: [Mnemonic or association technique]]

## Study Strategy & Common Pitfalls
**How to study this material**:
- Day 1-2: [Specific strategy tied to material type]
- Day 3-4: [Build on foundation]
- Day 5+: [Practice and application]

> **Biggest Mistake Students Make**: [Specific pitfall]
> **Instead, do this**: [Better approach]

**Common Misconceptions**:
1. ❌ Students think: [Wrong belief]
   ✅ Reality: [Correct understanding]

## Interactive Self-Check
Before the exam, verify you can:
- [ ] Explain [concept] to someone who's never heard of it
- [ ] Solve a [type] problem without notes in 5 minutes
- [ ] Draw/sketch [visual concept] from memory
- [ ] Compare and contrast [A vs B] with 3 key differences
- [ ] Apply [principle] to a new scenario

💭 **Reflection prompt**: If you could only remember ONE thing from this topic for the exam, what would it be and why?

**CONSTRAINTS**:
- Maximum 2 {{IMAGE:...}} markers - choose the most impactful visualizations
- Every concept needs an analogy or real-world connection
- Frame facts as stories or patterns, not isolated trivia
- Include at least 3 interactive self-check questions
- Use **bold** for ALL exam-critical terms

**LECTURE CONTENT**:
${content}`,

  summary: (content: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: You have received comprehensive lecture content that needs to be summarized at multiple levels with engaging narratives and visual concept mapping.

**TASK**: Create a multi-level, story-driven summary with visual aids showing how ideas connect.

**VISUAL REQUIREMENTS**: Create up to 2 visual markers - one for the overall concept hierarchy/structure, and one for the most complex relationship or process.

**FORMAT**: Generate the following:

# 📝 Content Summary

## The Big Picture (30 seconds)
[Frame as a compelling narrative hook: "Imagine..." or "What if..." Start with why this matters, then the essence in 1-2 sentences]

## Story Overview (2 minutes)
[Tell the topic as a journey or narrative arc:
- Where we're starting (the problem or question)
- What we discover (main insights)
- Where we end up (significance and implications)
Use **bold** for the 3-5 absolutely critical concepts.]

## Detailed Breakdown (5-10 minutes)
[Weave concepts into a coherent narrative:

**Act 1: Setting the Stage**
[Introduction: Why does this topic exist? What problem does it solve? Frame with real-world context or historical motivation]

**Act 2: The Core Ideas**
[Main concepts explained as building blocks:
- **First concept**: Define with analogy → Explain mechanism → Show example
- **Second concept**: Connect to first → Build complexity gradually → Show example
- *Key relationship*: How these concepts interact and depend on each other

💡 {{IMAGE:concept map showing how [main concepts] connect and build upon each other}}]

**Act 3: Putting It Together**
[Synthesis and implications:
- How parts create the whole
- Real-world applications
- What this enables or explains]

> **The Essential Insight**: [One-sentence crystallization of the core principle]

## Key Takeaways
[Frame as a story of insights gained:

**What we learned about [theme]**:
1. 📌 **Critical insight**: [Most important point - this changes everything]
2. **Building on that**: [Second most important - builds on #1]
3. **Practical application**: [How to use this knowledge]
4. **Connection to bigger picture**: [How this fits into larger field]
5. **Common pitfall to avoid**: [What NOT to think]

💡 *Mental model*: Think of this topic as [memorable analogy that ties it all together]]

## Visual Concept Map
{{IMAGE:hierarchical diagram showing the topic structure - main topic at center, major subtopics branching out, with key connections labeled}}

**How to read this map**:
- **Bold nodes**: Core concepts you must understand
- *Italic connections*: Important relationships
- Arrows show: [What the flow/dependency means]

**Text fallback** (if image not generated):
\`\`\`
Main Topic: [Name]
├── Foundation Concept 1
│   ├── Sub-concept A (leads to →)
│   └── Sub-concept B (enables →)
├── Foundation Concept 2
│   └── Connects back to Concept 1
└── Advanced Application
    └── Built on: Concepts 1 + 2
\`\`\`

## Interactive Learning Prompts
**Before moving on, check yourself**:
- 🤔 Can you explain this to a friend who knows nothing about it?
- 🎯 What's the ONE word that captures the essence?
- 🔗 How does this connect to something you already know?
- 🌟 What's the most surprising or counterintuitive part?

**Reflection**: What analogy would YOU use to explain this topic?

**CONSTRAINTS**:
- Maximum 2 {{IMAGE:...}} markers - prioritize overall structure and most complex relationship
- Every section should flow narratively into the next
- Use analogies and metaphors throughout
- Progress from simple to complex like telling a story
- **Bold** for must-know concepts, *italic* for key relationships
- Include at least 2 interactive reflection prompts

**LECTURE CONTENT**:
${content}`,

  quiz: (content: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: You need to create an engaging, comprehensive quiz that tests understanding through thoughtful questions, some of which benefit from visual problem-solving.

**TASK**: Generate a well-balanced quiz with storytelling context, visual elements where helpful, and educational explanations.

**VISUAL REQUIREMENTS**: Mark up to 2 questions that would benefit from diagrams to solve or explain (e.g., process questions, system analysis, comparisons).

**FORMAT**:

# 📝 Practice Quiz

## Part 1: Concept Understanding (5 questions)
[Frame each question with brief context/story to make it engaging:

**Question 1**: [Real-world scenario framing]
"Imagine you're [situation]. Based on the lecture, [actual question]?"

   A) [Option - make it plausible but wrong]
   B) [Option - common misconception]
   C) **[Correct option - properly explained]**
   D) [Option - tests deeper understanding]

   ✅ **Correct Answer**: C

   📖 **Why C is correct**: [Explanation connecting to core concept]

   ❌ **Why others are wrong**:
   - A: [Common error in thinking]
   - B: [Misconception addressed]
   - D: [Subtle difference explained]

   💡 **Key insight**: [Broader principle this tests]

Consider for visual questions: {{IMAGE:diagram showing [concept being tested] to help solve this question}}]

## Part 2: Application & Analysis (5 questions)
[Present scenarios that require applying concepts:

**Scenario-Based Question**:
> Context: [2-3 sentence real-world or hypothetical situation]
>
> Question: [What would happen? Why? How would you solve this?]

**Model Answer**:
[Structure: Identify → Apply → Conclude
- **Identify** what concepts apply
- **Apply** them to the scenario
- **Conclude** with the answer
Include **bolded key terms** from lecture]

💭 **Think about**: [Reflection prompt connecting to bigger picture]

If process/system question: {{IMAGE:flowchart or diagram showing [process/system] needed to solve this problem}}]

## Part 3: True/False with Justification (5 questions)
[Each statement tests a specific concept:

**Statement 1**: [Clear assertion about a concept]
❓ True or False?

**Answer**: [True/False] ✓

**Why this answer**: [Explanation that teaches the underlying concept]

**The tricky part**: [What makes students often get this wrong]

**Remember**: [Memory hook or principle to apply]]

## Part 4: Short Answer & Explanation (3 questions)
[Test deeper understanding:

**Question**: [Open-ended question requiring explanation]

**Model Answer should include**:
- [ ] **Definition** of key term
- [ ] **Example** illustrating the concept
- [ ] **Connection** to [related concept from lecture]
- [ ] **Implication** or real-world application

💯 **Full credit example**: "[Sample answer demonstrating all criteria]"

**Common mistakes**:
- ❌ Just defining without explaining WHY
- ❌ Missing the connection to [key principle]
- ✅ Strong answers explain the reasoning]

## Visual Problem-Solving Challenge
[If applicable, include 1-2 questions that benefit from diagram-based thinking:

**Challenge Question**: [Complex scenario requiring systems thinking]

**To solve this, students should**:
1. {{IMAGE:diagram template showing [empty framework for problem-solving]}}
2. Fill in the components
3. Trace the relationships
4. Draw the conclusion

**Solution approach**:
[Step-by-step breakdown]

**Complete answer**: [With visual reasoning explained]]

## Answer Key Summary
\`\`\`
Part 1: 1-C, 2-[Answer], 3-[Answer], 4-[Answer], 5-[Answer]
Part 2: [Scenario answers summarized]
Part 3: 1-[T/F], 2-[T/F], etc.
Part 4: [Key points for each answer]
\`\`\`

## Quiz Performance Guide
**Scoring**:
- 20 questions total
- Part 1 (5Q × 2pts = 10pts)
- Part 2 (5Q × 4pts = 20pts)
- Part 3 (5Q × 2pts = 10pts)
- Part 4 (3Q × 5pts = 15pts)
- Challenge (optional bonus: 5pts)
**Total**: 55 points (+ 5 bonus)

**What your score means**:
- 🌟 50+ : Excellent mastery
- 📚 40-49: Good understanding, review weak areas
- 📝 30-39: Basic grasp, needs more study
- 🔄 <30 : Re-study core concepts before exam

**Self-reflection**:
- Which questions took longest? → Those concepts need more practice
- Which explanations surprised you? → Deep dive into those topics
- Can you teach these answers to someone else? → Best test of understanding

**CONSTRAINTS**:
- Maximum 2 {{IMAGE:...}} markers for visual problem-solving questions
- Every question should test understanding, not just recall
- Frame questions in engaging scenarios when possible
- Explanations should teach, not just identify correct answers
- Include at least 3 "reflection" or "key insight" prompts
- Vary difficulty to build confidence while challenging students

**LECTURE CONTENT**:
${content}`,

  'mock-exam': (content: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: Students need a realistic practice exam to simulate actual testing conditions with visual problem-solving where applicable.

**TASK**: Create a comprehensive mock exam with engaging questions, visual aids for complex problems, and detailed grading guidance.

**VISUAL REQUIREMENTS**: Mark up to 2 complex questions that would benefit from diagrams for problem-solving or explanation.

**FORMAT**:

# 📋 Mock Exam

## Exam Instructions
⏰ **Time Allowed**: [Estimate based on content, e.g., 90 minutes]
📊 **Total Points**: 100
✅ **Passing Grade**: 60%

**Before You Begin**:
- Read ALL questions first (2 minutes) to plan your time
- **Time Budget**: Section A (20 min) | Section B (30 min) | Section C (25 min) | Section D (15 min)
- Answer easier questions first to build confidence
- Show your work for partial credit
- Leave nothing blank - educated guesses earn points

> 💡 **Pro Tip**: If stuck, move on and return later. Fresh eyes help!

---

## Section A: Multiple Choice (30 points - 2 points each)
⏱️ **Recommended Time**: 20 minutes (1-1.5 min per question)

[15 questions covering breadth:
- Frame some with real-world scenarios
- Test both knowledge and application
- Include 2-3 "challenging but fair" questions
- Make distractors plausible (common misconceptions)

For complex multi-step problems: {{IMAGE:diagram showing [system/process] needed to solve this question}}

Example format:
**Q1**: [Engaging scenario or context]
   A) [Option]
   B) [Option]
   C) [Correct - explained]
   D) [Tricky distractor]

**Exam tip for this question**: [Quick strategy hint]]

## Section B: Short Answer (30 points - 6 points each)
⏱️ **Recommended Time**: 30 minutes (6 min per question)

[5 questions requiring paragraph responses:
- Structure: Define → Explain → Apply → Example
- **Bold** what must be mentioned for full credit
- Include grading checklist for each

**Question format**:
"[Real-world context]. [Actual question requiring explanation]"

**To earn full credit (6 pts), your answer must**:
- [ ] Define key term (2 pts)
- [ ] Explain mechanism/why (2 pts)
- [ ] Provide example from lecture (2 pts)

⚠️ **Common mistakes**:
- Too brief (missing explanation depth)
- Forgetting to connect to bigger principle]

## Section C: Problem Solving/Analysis (25 points)
⏱️ **Recommended Time**: 25 minutes

[2-3 complex questions requiring detailed work:

**Problem 1** (12 points):
[Complex scenario requiring multi-step thinking]

{{IMAGE:diagram or flowchart showing [system/relationships] students must analyze}}

**Show your work**:
- **Step 1**: [What to identify/calculate]
- **Step 2**: [How to apply concepts]
- **Step 3**: [Final synthesis/conclusion]

**Grading Breakdown**:
- Correct identification (4 pts)
- Methodology shown (4 pts)
- Final answer (4 pts)

💡 **Hint**: This tests your understanding of [key concept]. Think about how [related concept] applies here.

**Problem 2** (13 points):
[Another complex scenario]
[Similar structure with clear grading criteria]]

## Section D: Essay/Synthesis (15 points)
⏱️ **Recommended Time**: 15 minutes

**Essay Prompt**:
[Thought-provoking question requiring integration of 3+ concepts from different parts of the lecture]

**Strong essays will**:
- Start with a clear thesis/main argument
- Draw connections between **[Concept A]**, **[Concept B]**, and **[Concept C]**
- Use specific examples from the lecture
- Address potential counterarguments or limitations
- Conclude with broader implications

**Grading Rubric**:
- Thesis clarity (3 pts)
- Concept integration (6 pts)
- Examples & evidence (3 pts)
- Organization & clarity (3 pts)

> **Note**: You don't need to write perfect prose under time pressure. Focus on clear, logical argumentation with specific evidence.

---

## Complete Answer Key & Rubric

### Section A Answers:
\`\`\`
1-[A/B/C/D]  2-[A/B/C/D]  3-[A/B/C/D] ... 15-[A/B/C/D]
\`\`\`

**Explanations**:
[For each:
- ✅ Correct answer with reasoning
- ❌ Why distractors are wrong
- 📚 Concept tested
- **Bold** key principle]

### Section B Model Answers:
[For each question:
**Full Credit Answer** (6 pts):
[Complete model response with **key terms** highlighted]

**Partial Credit Guidance**:
- 4-5 pts: [What's included]
- 2-3 pts: [What's missing]
- 0-1 pts: [Fundamental misunderstanding]

**Common errors students make**: [Specific pitfalls]]

### Section C Solutions:
[For each problem:
**Step-by-step solution**:
1. [Analysis with reasoning]
2. [Application with work shown]
3. [Conclusion]

**Partial credit**:
- Show work even if answer is wrong
- Correct method + calculation error = most points
- Missing steps = points deducted]

### Section D Essay Rubric:
**Excellent (13-15 pts)**: [Specific criteria]
**Good (10-12 pts)**: [What's needed]
**Satisfactory (7-9 pts)**: [Minimum requirements]
**Needs Work (0-6 pts)**: [What's missing]

---

## Performance Analysis & Study Guide

**Score Interpretation**:
- 🌟 **90-100**: Excellent! You've mastered the material. Focus on timing and exam strategy.
- 📚 **80-89**: Strong understanding. Review questions you missed to identify knowledge gaps.
- 📝 **70-79**: Good foundation. Spend extra time on [sections where you struggled].
- 🔄 **60-69**: Passing, but vulnerable. Revisit core concepts and practice application.
- ⚠️ **Below 60**: Significant gaps. Re-study fundamentals before attempting real exam.

**If you struggled with**:
- **Section A (Multiple Choice)**: Review [key concepts list]. You need stronger foundation.
- **Section B (Short Answer)**: Practice explaining concepts out loud. Teach someone else.
- **Section C (Problem Solving)**: Work through more practice problems. Focus on methodology.
- **Section D (Essay)**: Practice outlining before writing. Connect concepts explicitly.

**Recommended Study Plan Based on Score**:

**< 70 points**: [Specific 5-day study plan with focus areas]
**70-85 points**: [3-day targeted review plan]
**> 85 points**: [Final review checklist]

💭 **Reflection Questions**:
- Which section felt hardest under time pressure?
- What concepts do you wish you understood better?
- If you retake this, what would you change in your approach?

**CONSTRAINTS**:
- Maximum 2 {{IMAGE:...}} markers for the most complex problem-solving questions
- Questions must match university exam difficulty and style
- Every question needs specific grading criteria
- Time management guidance throughout
- Frame at least 1/3 of questions with engaging scenarios/contexts
- Include detailed performance analysis tied to specific study recommendations

**LECTURE CONTENT**:
${content}`,

  explain: (content: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: Students need engaging, step-by-step explanations with visual aids that build understanding through storytelling and memorable analogies.

**TASK**: Transform the lecture into a narrative journey of discovery, breaking down complexity into digestible, connected pieces with visual support for the trickiest concepts.

**VISUAL REQUIREMENTS**: Identify up to 2 concepts that absolutely need visual explanation - typically processes, systems, or complex relationships.

**APPROACH**: First, analyze the content to:
1. Identify all main concepts
2. Determine prerequisite knowledge
3. Order concepts by dependency (what must be understood first)
4. Find the narrative thread connecting all concepts
5. Then explain as a story of discovery

**FORMAT**:

# 🎯 The Journey to Understanding: [Topic Name]

## Your Learning Map
[Tell students the journey ahead - frame as an adventure or story:

🎬 **The Story Arc**:
1. **Starting Point**: [What we already know or can relate to]
2. **First Discovery**: [Foundation concept] - This unlocks →
3. **Building Up**: [Intermediate concepts] - Which leads to →
4. **The Revelation**: [Advanced insight] - Finally explains →
5. **The Application**: [Real-world use]

**Why this order matters**: [Explain the logical flow - each concept depends on the previous one]]

---

## Part 1: [First Concept Name] - The Foundation

### The Big Question
[Frame concept as answering a question or solving a puzzle: "Have you ever wondered why...?" or "Imagine if..."]

### What is it? (In Simple Words)
[Define using only everyday language first, THEN introduce technical term]

💡 **Think of it like this**: [Memorable analogy from everyday life]
> For example, [concept] is like [familiar thing] because [key parallel]

### Why Should You Care?
[Tell a story about its importance:
- Historical context or discovery moment
- Real-world problem it solves
- What becomes possible once you understand this]

### How It Actually Works
[Explain mechanism as a narrative process:

**Step 1**: [First thing that happens]
→ This causes **Step 2**: [Next thing]
→ Which results in **Step 3**: [Outcome]

Key relationship: When [X happens], then [Y happens] because [Z principle]]

### Visual Breakdown
{{IMAGE:step-by-step diagram showing how [concept] works, with labeled stages and arrows showing flow}}

**If you had to draw this**:
[Provide text-based description student could sketch:
"Draw three boxes connected by arrows. First box: [component]. Second box: [transformation]. Third box: [result]"]

### Real Example from Your Life
[Connect to something students experience:
"When you [common activity], you're actually experiencing [concept] because..."]

**Lecture Example**: [Specific example from the material]

### Where Students Get Confused
❌ **Common Mistake**: Thinking [misconception]
✅ **Reality**: Actually [correct understanding]

**Why this confusion happens**: [Explain the source of the misconception - often it's applying intuition from [related but different thing]]

### Quick Self-Check
Before moving on, can you:
- [ ] Explain this to a younger sibling in one sentence?
- [ ] Draw a simple sketch showing how it works?
- [ ] Think of your own example (different from the lecture)?

💭 **Reflection**: What surprised you most about this concept?

---

## Part 2: [Second Concept Name] - Building Higher

### Connecting Back
> **Remember from Part 1**: We learned [key point]. Now we're ready to understand how [new concept] builds on that foundation.

### The Story Continues...
[Frame this concept as the next chapter:
"Now that we know [Part 1 concept], a natural question arises: [question that Part 2 answers]"]

[Continue same structure: What/Why/How/Visual/Example/Confusion/Check]

[If this concept has complex relationships]:
{{IMAGE:diagram showing how [Part 1 concept] connects to [Part 2 concept], with other related ideas and feedback loops labeled}}

---

[Continue for all major concepts, always connecting back to previous parts...]

---

## The Big Picture: How Everything Connects

### Zooming Out
[Now that students understand individual pieces, show the complete system]

**The Full Story**: [Weave all parts into one coherent narrative]

{{IMAGE:comprehensive concept map showing all main ideas and how they interact - center concept with radiating connections, feedback loops, and hierarchies clearly marked}}

**Text Summary** (in case diagram doesn't generate):
\`\`\`
            [Core Concept]
                 ↓
        Splits into 3 branches:
        ├─ [Concept 1] ───→ enables [Application A]
        ├─ [Concept 2] ───→ combines with Concept 1
        └─ [Concept 3] ───→ depends on Concept 1 + 2
                              ↓
                    [Final Understanding]
\`\`\`

### The "Aha!" Moment
> **The Essential Insight**: [One powerful sentence that captures the core principle, now that students have all the context to appreciate it]

**Why this matters in the real world**:
1. [Application 1 with concrete example]
2. [Application 2 showing broader impact]
3. [Implication for further learning or career]

### Common Patterns to Remember
[Extract 2-3 general principles that apply beyond this specific topic:
- "Whenever you see [pattern], expect [relationship]"
- "If [X] increases, [Y] must [change] because [principle]"]

## Interactive Review Challenge

**Now that you've learned everything, test your mastery**:

1. **The Elevator Pitch** (30 seconds):
   Can you explain the entire topic to someone in one brief, clear paragraph?

2. **The Connections Game**:
   List 3 ways [Concept A] relates to [Concept B]. How do they depend on each other?

3. **The Real-World Detective**:
   Find an example of [main concept] in your daily life that wasn't mentioned in the lecture.

4. **The Teaching Test**:
   What analogy would YOU create to explain [trickiest concept] to a friend?

5. **The What-If**:
   If [key principle] didn't work, what would break? What would still function?

**Reflection Prompts**:
💡 Which part was hardest to grasp? What finally made it click?
🔗 How does this connect to [other course topics]?
🌟 What's one thing you'll remember about this topic in 5 years?

## Study Tips for This Material

**To truly master this**:
- **Visual learners**: Sketch the diagrams from memory, then check
- **Verbal learners**: Explain it out loud, record yourself, listen back
- **Hands-on learners**: Find or create a real example you can interact with
- **Abstract thinkers**: Write out the principles as if-then logic statements

**When reviewing**:
1. Start with the big picture (the complete connection map)
2. Dive into parts you feel shaky on
3. Test yourself by teaching someone else
4. Create your own examples (best test of understanding)

**CONSTRAINTS**:
- Maximum 2 {{IMAGE:...}} markers - choose the most critical process/system and the overall connections map
- EVERY concept needs a memorable analogy or metaphor
- Build concepts like a story - each part naturally leads to the next
- Use simple language FIRST, technical terms SECOND
- Include "check your understanding" questions after each major part
- Connect everything back to students' lived experiences
- **Bold** for critical definitions, *italic* for key relationships
- Frame the learning as discovery, not memorization

**LECTURE CONTENT**:
${content}`,

  custom: (content: string, customPrompt: string) => `${SYSTEM_CONTEXT}

**CONTEXT**: A student has made a specific request about the lecture content. Your response should be tailored, engaging, and visually enhanced to meet their exact needs while maintaining high educational quality.

**STUDENT'S REQUEST**:
${customPrompt}

**TASK**: Fulfill the student's request with excellence, using storytelling, visual aids, and interactive elements as appropriate to create the most effective learning experience.

**VISUAL REQUIREMENTS**:
- Analyze whether the request would benefit from diagrams or visual aids
- If yes, identify up to 2 concepts that need visualization (maximum)
- Use {{IMAGE:detailed description}} syntax for visual markers
- Choose visuals that directly address the student's specific request

**ADAPTIVE FORMATTING STRATEGY**:

*For explanation/clarification requests*:
- Use storytelling to make concepts memorable
- Include **bold** for key terms and *italics* for relationships
- Add > blockquotes for essential takeaways
- Provide analogies: 💡 *Think of it as*: [memorable comparison]
- Include "Where this fits in the bigger picture" section

*For summarization/overview requests*:
- Create a narrative arc connecting ideas
- Use visual concept maps if relationships are complex
- Highlight **must-know points** vs. nice-to-know details
- Add "Quick Mental Model" for rapid recall

*For example/application requests*:
- Frame examples as mini-stories or scenarios
- Show step-by-step progression with visual flowcharts if complex
- Connect to real-world situations students can relate to
- Include "Try it yourself" challenges

*For comparison/analysis requests*:
- Use side-by-side comparisons with clear structure
- Consider {{IMAGE:comparison table/Venn diagram}} for complex comparisons
- Highlight critical differences in **bold**
- Add "Common confusions" section with ❌/✅ clarifications

*For study strategy/how-to-learn requests*:
- Provide actionable, specific techniques
- Include mnemonic devices or memory aids
- Suggest practice activities with examples
- Add "Self-check questions" to verify understanding

**ENGAGEMENT ELEMENTS TO INCLUDE** (choose based on request type):
1. **Opening Hook**: Start with why this matters or a relatable question
2. **Storytelling**: Frame information as a journey or narrative when possible
3. **Analogies**: Connect abstract concepts to familiar experiences
4. **Interactivity**: Include reflection questions or self-check prompts
5. **Visual Planning**: Mark where diagrams would clarify complex ideas
6. **Practical Application**: Show how to use this knowledge
7. **Common Pitfalls**: Address typical student misconceptions

**QUALITY STANDARDS**:
- **Directly address the request** - don't go off-topic
- **Be thorough yet focused** - comprehensive but not overwhelming
- **Use the lecture content strictly** - don't add external information
- **Make it memorable** - use techniques that aid retention
- **Encourage active learning** - include opportunities for engagement
- **If request is unclear**, interpret generously to provide maximum value while noting your interpretation

**STRUCTURE TEMPLATE** (adapt as needed):

# 🎯 [Title based on student's request]

[**Opening hook** - Why this matters or a compelling question]

## Your Personalized Response

[**Main content** - Directly fulfill the request using appropriate formatting, storytelling, visual markers, and engagement elements based on the request type]

[**Visual aids** - Include up to 2 {{IMAGE:...}} markers for complex concepts if beneficial]

## 💡 Key Takeaways

> [**Essential points** - Distill the response into memorable bullets]
> - **[Key point 1]**: [Brief explanation]
> - **[Key point 2]**: [Brief explanation]
> - **[Key point 3]**: [Brief explanation]

## 🔍 Quick Self-Check

[**Interactive verification** - 2-3 questions or prompts to ensure understanding:]
- [ ] Can you explain [key concept] in your own words?
- [ ] What's the connection between [A] and [B]?
- [ ] How would you apply this to [scenario]?

## 📚 How This Connects

[**Broader context** - Show how this fits into the bigger picture of the course/topic]

---

**LECTURE CONTENT**:
${content}

**OUTPUT**:
[Provide your tailored, engaging response below following the adaptive formatting strategy]`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, slideText, imageAnalysis, materialType, customPrompt, extractionErrors, modelTier, maxImages } = body;

    // Check what sources were provided and which failed
    const hasTranscript = transcript && transcript.trim().length > 0;
    const hasSlideText = slideText && slideText.trim().length > 0;
    const hasImageAnalysis = imageAnalysis && imageAnalysis.trim().length > 0;

    // If nothing was extracted, provide specific feedback
    if (!hasTranscript && !hasSlideText && !hasImageAnalysis) {
      // Build a helpful error message based on what was attempted
      const errorDetails: string[] = [];

      // Check if extraction errors were passed from the frontend
      if (extractionErrors) {
        if (Array.isArray(extractionErrors)) {
          extractionErrors.forEach((err: any) => {
            if (err.type === 'pdf' && err.error) {
              if (err.error.includes('extractable text')) {
                errorDetails.push('• PDF file contains only images with no selectable text. Try uploading the images separately or use a PDF with text content.');
              } else if (err.error.includes('timeout')) {
                errorDetails.push('• PDF processing timed out. The file may be too large or corrupted. Try a smaller file.');
              } else if (err.error.includes('too short')) {
                errorDetails.push('• PDF extraction returned minimal text. The file may be mostly images or have encoding issues.');
              } else {
                errorDetails.push(`• PDF extraction failed: ${err.error}`);
              }
            } else if (err.type === 'pptx' && err.error) {
              errorDetails.push(`• PowerPoint extraction failed: ${err.error}`);
            }
          });
        } else if (typeof extractionErrors === 'string') {
          errorDetails.push(`• File extraction failed: ${extractionErrors}`);
        }
      }

      // If no specific errors, provide general guidance
      if (errorDetails.length === 0) {
        errorDetails.push('• No content was extracted from the uploaded files.');
        errorDetails.push('• If you uploaded a PDF, it may be image-based or scanned. Try extracting images from the PDF and uploading them separately.');
        errorDetails.push('• Ensure your files contain actual text or visual content, not empty pages.');
      }

      return NextResponse.json(
        {
          error: 'Unable to generate study materials: No content extracted',
          details: errorDetails.join('\n'),
          suggestions: [
            'Upload a different file format (PDF with text, PPTX, or images)',
            'Check that your PDF has selectable text (not just scanned images)',
            'Try uploading course materials in multiple formats',
            'Upload whiteboard photos or lecture slides as separate images'
          ]
        },
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

    // Validate context with detailed feedback
    const validation = validateContext({
      transcript: transcript || '',
      slideText: slideText || '',
      imageAnalysis: imageAnalysis || ''
    });
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.message || 'Validation failed',
          details: validation.details ? validation.details.join('\n') : undefined,
          suggestions: [
            'Upload files with more content',
            'Ensure PDFs have selectable text (not scanned images)',
            'Try combining multiple sources (audio + slides + photos)',
            'Check that uploaded files are not corrupted or empty'
          ]
        },
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

    // Get the appropriate model based on user selection
    const selectedModel = getModelById((modelTier as ModelTier) || 'default');
    console.log('Using model:', selectedModel, 'for tier:', modelTier || 'default');
    const model = genAI.getGenerativeModel({ model: selectedModel });

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

    // Parse visual markers from generated content
    console.log('Parsing visual markers for image generation...');
    const parsedContent = parseVisualMarkers(generatedText);
    console.log(`Found ${parsedContent.markerCount} visual markers`);

    // Parse and validate maxImages (default to 2 if not provided)
    const userMaxImages = maxImages !== undefined
      ? Math.min(Math.max(0, parseInt(maxImages)), 2) // Clamp between 0 and 2
      : 2; // Default to 2

    // Auto-generate images if markers exist and user wants images
    let finalContent = generatedText;
    let imageData: MaterialImageData | undefined;

    if (parsedContent.markerCount > 0 && userMaxImages > 0) {
      const educationalLevel = estimateEducationalLevel(mergedContext.combinedContent);

      const proposals = generateImageProposals(
        parsedContent.markers,
        mergedContext.combinedContent,
        {
          educationalLevel,
          materialType,
          maxImages: userMaxImages,
        }
      );

      console.log(`Generated ${proposals.length} image proposals (user limit: ${userMaxImages})`);

      // Auto-generate images for each proposal
      const generatedImages: ImageGenerationResponse[] = [];
      let totalCost = 0;

      for (const proposal of proposals) {
        try {
          console.log(`Generating image for: ${proposal.originalDescription.substring(0, 50)}...`);

          // Call internal image generation
          const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              request: {
                prompt: proposal.enhancedPrompt,
                educationalContext: proposal.originalDescription,
                imageType: proposal.imageType,
                aspectRatio: '4:3',
              },
              materialId: generateMaterialId(),
              proposalId: proposal.id,
            }),
          });

          if (imageResponse.ok) {
            const imageResult = await imageResponse.json();
            if (imageResult.success && imageResult.image) {
              generatedImages.push(imageResult.image);
              totalCost += imageResult.cost || 0;

              // Replace marker with actual image in markdown format
              const imageMarkdown = imageResult.image.imageData
                ? `![${proposal.originalDescription}](data:${imageResult.image.mimeType};base64,${imageResult.image.imageData})`
                : `[Image generation successful but no data: ${proposal.originalDescription}]`;

              const marker = parsedContent.markers.find(m => m.id === proposal.markerId);
              if (marker) {
                finalContent = finalContent.replace(marker.rawMarker, imageMarkdown);
              }

              console.log(`✓ Image generated successfully for: ${proposal.originalDescription.substring(0, 50)}...`);
            } else {
              console.warn(`Image generation failed: ${imageResult.error || 'Unknown error'}`);
              // Replace with placeholder
              const marker = parsedContent.markers.find(m => m.id === proposal.markerId);
              if (marker) {
                finalContent = finalContent.replace(marker.rawMarker, `[Image could not be generated: ${proposal.originalDescription}]`);
              }
            }
          } else {
            console.warn(`Image generation request failed with status: ${imageResponse.status}`);
            // Replace with placeholder
            const marker = parsedContent.markers.find(m => m.id === proposal.markerId);
            if (marker) {
              finalContent = finalContent.replace(marker.rawMarker, `[Image could not be generated: ${proposal.originalDescription}]`);
            }
          }
        } catch (imageError: any) {
          console.error(`Image generation error for proposal ${proposal.id}:`, imageError);
          // Replace with placeholder on error
          const marker = parsedContent.markers.find(m => m.id === proposal.markerId);
          if (marker) {
            finalContent = finalContent.replace(marker.rawMarker, `[Image could not be generated: ${proposal.originalDescription}]`);
          }
        }
      }

      // Create material image data
      imageData = {
        materialId: generateMaterialId(),
        visualMarkers: parsedContent.markers,
        proposals,
        finalImages: generatedImages,
        totalCost,
        limitReached: proposals.length >= userMaxImages,
        processingStartedAt: new Date().toISOString(),
        processingCompletedAt: new Date().toISOString(),
      };

      console.log(`Image generation complete. Generated ${generatedImages.length}/${proposals.length} images. Total cost: $${totalCost.toFixed(4)}`);
    } else if (parsedContent.markerCount > 0 && userMaxImages === 0) {
      // User doesn't want images - remove markers from content
      finalContent = parsedContent.cleanContent;
      console.log('User set maxImages=0, removed all image markers from content');
    }

    return NextResponse.json({
      success: true,
      content: finalContent, // Return content with embedded images or placeholders
      materialType,
      timestamp: new Date().toISOString(),
      sources: mergedContext.sources,
      stats: mergedContext.stats,
      // Image generation data
      imageData: imageData || null,
      hasImages: !!imageData && imageData.finalImages.length > 0,
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
