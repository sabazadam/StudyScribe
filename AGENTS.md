# CrammingAI - Master Agent Instructions & Task Tracker

> **Project Transformation:** LectureHelper AI → CrammingAI
> **Timeline:** 6 weeks (Started: December 4, 2025)
> **Budget:** $28/month operational costs
> **Status:** 🟡 Phase 1 - Foundation (Week 1)

---

## 📋 QUICK STATUS

**Current Sprint:** ✅ READY FOR PRODUCTION
**Next Tasks:** Deploy to Vercel → Monitor performance → Gather user feedback
**Blockers:** None
**Last Updated:** December 4, 2025 - 7:30 PM

---

## 🎯 PROJECT OVERVIEW

### Identity
- **Name:** CrammingAI (formerly LectureHelper AI)
- **Purpose:** AI-powered study material generation platform
- **Tagline:** "Smart studying, not hard studying"
- **Target Users:** University students, self-learners

### Technology Stack
```
Frontend:  Next.js 14.2, React 18, TypeScript, Tailwind CSS
Backend:   Firebase (Auth, Firestore, Storage)
Hosting:   Vercel
AI:        Google Gemini 1.5 (Pro/Flash), Imagen 3
```

### Core Features Status
- ✅ Study Material Generation
- ✅ Quiz Creation
- ✅ Image Generation
- ✅ Transcription (Enhanced)
- ✅ Folder Organization
- ✅ Mock Exam Generator
- ⏳ Launch Preparation (IN PROGRESS)

---

## 📅 6-WEEK IMPLEMENTATION ROADMAP

### Week 1: Foundation (Dec 4-10) - ✅ COMPLETED
```
Goals:
- [x] Phase 2 assessment complete
- [x] Rebrand to CrammingAI (15/15 files)
- [x] Design folder database schema
- [x] Implement 60s timeout for AI requests
- [x] Sentry integration & configuration
```

### Week 2: Organization (Dec 11-17) - ✅ COMPLETED
```
Goals:
- [x] Build folder UI components (FolderTree, FolderPicker, FolderBreadcrumb)
- [x] Add navigation in Study Hub
- [x] Integrate folders into material creation
- [x] Deploy Firestore rules and indexes
- [x] Fix all build errors and type issues
```

### Week 3: Transcription (Dec 18-24) - ✅ COMPLETED
```
Goals:
- [x] Create standalone transcription page at /transcribe
- [x] Add download/save transcript features (TXT)
- [x] Link transcription to material creation workflow
- [x] Folder selection for saving transcripts
- [x] File format support (MP3, MP4, WAV, M4A, WEBM, OGG)
- [x] Integration with header navigation
```

### Week 4-5: Mock Exam (Dec 25 - Jan 7) - ✅ COMPLETED
```
Goals:
- [x] Build exam upload & analysis
- [x] Create material linking system (2-5 materials)
- [x] Engineer AI prompts for generation
- [x] Export professional PDFs (HTML with print styles)
```

### Week 6: Launch (Jan 8-14)
```
Goals:
- [ ] Integrate Sentry monitoring
- [ ] Mobile responsiveness testing
- [ ] Performance optimization
- [ ] Production deployment
```

---

## 🚀 ACTIVE SPRINT: WEEK 1 - FOUNDATION

### Today's Focus (Dec 4, 2025)
1. ✅ Create comprehensive agents.md
2. ⏳ Start branding update analysis
3. ⏳ Design folder schema

### This Week's Tasks

#### Task 1: Branding Update (Priority: P0)
**Files to Update (10):**
```
1. package.json - name, description
2. README.md - all references
3. app/layout.tsx - metadata
4. components/layout/Header.tsx - logo
5. app/create/page.tsx - title
6. app/results/page.tsx - header
7. app/hub/page.tsx - title
8. app/(landing)/page.tsx - hero
9. public/manifest.json (if exists)
10. .env.example - comments
```

**Search Patterns:**
- "LectureHelper AI" → "CrammingAI"
- "LectureHelper" → "CrammingAI"
- "lectureHelper" → "crammingAI"
- "lecture-helper" → "cramming-ai"

**Verification:**
```bash
grep -r "LectureHelper" . --exclude-dir=node_modules
grep -r "lectureHelper" . --exclude-dir=node_modules
```

#### Task 2: Folder Database Schema (Priority: P0)
**New Collection: folders**
```typescript
interface FolderDocument {
  id: string;
  userId: string;
  name: string;
  parentFolderId: string | null;
  path: string[]; // ["CS101", "Week 3"]
  createdAt: Timestamp;
  updatedAt: Timestamp;
  color?: string;
  materialCount?: number;
}
```

**Update materials collection:**
```typescript
// Add these fields:
folderId: string | null
folderPath: string[]
```

**New Files to Create:**
```
lib/types/firestore.ts - Add FolderDocument
lib/firestore/folderRepository.ts - CRUD ops
app/api/folders/route.ts - POST, GET
app/api/folders/[id]/route.ts - PUT, DELETE
```

**Firestore Rules:**
```javascript
match /folders/{folderId} {
  allow create: if isAuthenticated()
    && request.resource.data.userId == request.auth.uid;
  allow read, update, delete: if isOwner(resource.data.userId);
}
```

**Indexes to Deploy:**
```json
{
  "indexes": [
    {
      "collectionGroup": "folders",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "parentFolderId", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "materials",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "folderId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

#### Task 3: Timeout Handling (Priority: P0)
**Create utility:**
```typescript
// lib/utils/timeout.ts
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 60000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}
```

**Apply to:**
- app/api/generate-materials/route.ts
- app/api/transcribe/route.ts
- app/api/generate-image/route.ts

---

## 📂 FEATURE SPECIFICATIONS

### 1. Folder Organization System
**Status:** 🟡 In Progress (Week 1-2)
**Priority:** P0 (Blocks other features)

#### User Decisions Applied
- ✅ Delete folder → Delete materials (with warning)
- ✅ Max depth: 3 levels recommended
- ✅ Remember last folder used

#### UI Components Needed
```
components/ui/
├── FolderTree.tsx - Hierarchical display
├── FolderBreadcrumb.tsx - Navigation path
├── MaterialCard.tsx - Enhanced with folder
└── DragDropZone.tsx - Reorganization

components/modals/
├── CreateFolderModal.tsx - New folder
├── DeleteFolderWarning.tsx - Shows material count
└── MoveMaterialModal.tsx - Folder picker
```

#### API Endpoints
```
POST   /api/folders          - Create
GET    /api/folders          - List all
PUT    /api/folders/[id]     - Rename
DELETE /api/folders/[id]     - Delete + materials
POST   /api/materials/[id]/move - Move to folder
```

#### Testing Checklist
- [ ] Create root folder
- [ ] Create nested folder (max 3)
- [ ] Rename folder
- [ ] Delete empty folder
- [ ] Delete folder with materials (verify warning)
- [ ] Drag material between folders
- [ ] Save new material to folder
- [ ] Verify last folder remembered

---

### 2. Mock Exam Generator
**Status:** 🔴 Not Started (Week 4-5)
**Priority:** P1 (Revenue feature)

#### User Decisions Applied
- ✅ Allow 2-5 materials per exam
- ✅ Generate answer key option
- ✅ Save to selected folder

#### User Flow
```
1. Upload past mock exam (PDF)
   └─> Extract text & structure

2. Select 2-5 materials from Study Hub
   └─> Show total context size
   └─> Warn if > 100K tokens

3. Configure
   ├─> Question count
   ├─> Include answer key?
   └─> Target folder

4. Generate (20-30 seconds)

5. Preview & Download
   ├─> Review questions
   ├─> Regenerate specific ones
   ├─> Download PDF
   └─> Save to Study Hub
```

#### AI Prompt Strategy
**Phase 1: Style Analysis**
```typescript
const prompt = `
Analyze exam structure:
${examText}

Output JSON:
{
  "questionTypes": ["MCQ", "short-answer"],
  "questionCount": {"MCQ": 10, "short": 3},
  "difficulty": "medium",
  "topicDistribution": {...},
  "formattingStyle": "academic"
}
`;
```

**Phase 2: Generation**
```typescript
const prompt = `
Generate exam matching this style:
${styleAnalysis}

Using content from:
${material1}
${material2}
...

Requirements:
- ${questionCount} questions
- Match distribution
- Same difficulty
- Use ONLY provided content
`;
```

#### Cost Per Exam
```
Analysis:   $0.006
Generation: $0.008
Input:      $0.001
-------------------
TOTAL:      $0.015 per exam
```

#### Quota
```typescript
FREE_TIER: 3 exams/day
PREMIUM: 10 exams/day
```

---

### 3. Enhanced Transcription
**Status:** 🔴 Not Started (Week 3)
**Priority:** P1 (UX improvement)

#### User Decisions Applied
- ✅ Remember last folder used
- ✅ Quick save workflow

#### New Page: /transcribe
```typescript
User Flow:
1. Upload audio/video
2. Show progress (0-100%)
3. Display transcript
4. Actions:
   ├─> Download TXT
   ├─> Copy to clipboard
   ├─> Save to Hub (remembers folder)
   └─> Create Material from This
```

#### Components
```
app/transcribe/page.tsx
components/transcription/
├── TranscriptionUploader.tsx
├── TranscriptionProgress.tsx
├── TranscriptViewer.tsx
└── TranscriptActions.tsx
```

---

## 💰 COST TRACKING

### Current Monthly Costs (Dec 2025)
```
Gemini API:  $10/month
Imagen API:  $3/month
Firebase:    $5/month
Vercel:      $0 (Hobby)
---------------------------
TOTAL:       $18/month
```

### Projected with All Features
```
Gemini API:  $15/month (+50%)
Imagen API:  $3/month
Firebase:    $5/month
Upstash:     $5/month (Redis)
---------------------------
TOTAL:       $28/month
```

### Cost Optimization Options
```
Option A: Full Stack        $43/month (Vercel Pro)
Option B: Budget Stack      $28/month (Upstash) ⭐
Option C: Ultra Budget      $23/month (localStorage)
```

**Selected:** Option B ($28/month)

### Revenue Model
```
Free Tier:
- 10 materials/day
- 5 images/day
- 3 mock exams/day

Premium ($5/month):
- 50 materials/day
- 20 images/day
- 10 mock exams/day

Breakeven: 6 paying users
```

---

## 🔧 TECHNICAL DEBT

### Critical (This Week)
- [ ] Timeout handling (60s)
- [ ] Rate limiting (Upstash/localStorage)
- [ ] Folder schema deployment

### High Priority (Before Launch)
- [ ] Sentry integration
- [ ] Mobile testing
- [ ] Performance audit (Lighthouse 90+)

### Medium Priority (Post-Launch)
- [ ] Email verification (wait for 100+ users)
- [ ] Analytics dashboard
- [ ] Dark mode polish

### Low Priority (Future)
- [ ] Multi-language support
- [ ] Collaborative folders
- [ ] Study groups

---

## 🎬 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] TypeScript build passes
- [ ] Firestore rules deployed
- [ ] Indexes built & verified
- [ ] Environment variables set
- [ ] No console errors
- [ ] Bundle size < 500KB

### Deploy
- [ ] Create preview deployment
- [ ] Smoke test all features
- [ ] Lighthouse audit
- [ ] Deploy to production

### Post-Deployment
- [ ] Monitor Sentry (24 hours)
- [ ] Check costs
- [ ] Collect user feedback

---

## 📊 MONITORING & ALERTS

### Cost Alerts
```
$20/month: Email
$30/month: Email + SMS
$40/month: Review usage
```

### Error Alerts (Sentry)
```
New error: Immediate
Regression: 1 hour
Performance: Daily
```

### Sentry Configuration
**Rules Location:** `.claude/sentry-rules.md`

All Sentry usage must follow the project rules:
- Use `Sentry.captureException()` for error handling
- Create spans with `Sentry.startSpan()` for performance tracking
- Use `logger.fmt` template literals for structured logging
- Always import: `import * as Sentry from "@sentry/nextjs"`
- Console logging integration enabled for log/warn/error levels

---

## 🤝 AGENT ORCHESTRATION

### When to Use Sub-Agents
- **ux-design-architect:** Complex UI decisions
- **code-quality-auditor:** Pre-launch review
- **security-auditor:** Security features
- **performance-engineer:** Optimization

### Deployment Order
```
1. Test with Firebase emulator
2. Deploy firestore rules
3. Deploy firestore indexes
4. Deploy code to Vercel
5. Monitor for 24 hours
```

---

## ✅ LAUNCH CRITERIA

### Must-Have (Blocking)
- [ ] All branding updated
- [ ] Folder system working
- [ ] Mock exam generator functional
- [ ] Transcription tool ready
- [ ] Mobile responsive
- [ ] Sentry monitoring active
- [ ] Performance targets met

### Nice-to-Have (Post-Launch)
- [ ] Email verification
- [ ] Advanced analytics
- [ ] Collaborative features

---

## 📝 DECISIONS LOG

### December 4, 2025
✅ Folder deletion: Delete materials with warning
✅ Mock exam: 2-5 materials allowed
✅ Transcription: Remember last folder
✅ Budget: $28/month approved

### Open Questions
- [ ] Folder icon customization?
- [ ] Manual exam question editing?
- [ ] Collaborative folders timeline?

---

## 📚 VERSION HISTORY

### v2.0.0 - "CrammingAI Launch" (Target: Jan 14, 2026)
- Rebranded to CrammingAI
- Folder organization
- Mock exam generator
- Enhanced transcription
- Improved navigation

### v1.5.0 - "Professional Polish" (Dec 4, 2025)
- Fixed auth race conditions
- Redesigned header
- Added UserMenu everywhere

### v1.0.0 - "LectureHelper MVP" (Nov 2025)
- Initial launch

---

**Project Owner:** Kerem Bozdag
**AI Assistant:** Claude (Sonnet 4.5)
**Last Updated:** December 4, 2025, 10:00 PM
**Next Review:** December 11, 2025 (End of Week 1)

---

_This file serves as the single source of truth for the CrammingAI transformation project. All agents must read this file before starting any task._
