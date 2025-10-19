# Active Context: StudyScribe

## Current Work Focus
**Date**: October 19, 2024
**Phase**: Initial Setup & Development
**Goal**: Create functional UI with basic backend for presentation tomorrow

## Immediate Next Steps

### In Progress
1. Creating Memory Bank documentation
2. Setting up project structure

### Up Next (Today)
1. Initialize Next.js project with TypeScript and Tailwind CSS
2. Create unified design system
3. Build shared components (Header, Layout)
4. Build all 4 main pages (Dashboard, Study Hub, Lecture Processor, Whiteboard Enhancer)
5. Implement basic file upload API
6. Create mock AI processing APIs
7. Test all user flows

## Recent Decisions

### Design System Unification
**Decision**: Unify the disparate HTML designs into a single cohesive design system
**Rationale**: The provided HTML files have inconsistent:
- Color schemes (indigo/teal vs. blue)
- Header designs
- Component styling

**Chosen Approach**:
- **Primary Color**: `#1193d4` (blue) - trustworthy, academic
- **Accent Color**: `#14B8A6` (teal) - energetic, engaging
- **Typography**: Inter font family throughout
- **Header**: Single unified header with logo, navigation, and "Upgrade to Pro" button
- **Dark Mode**: Consistent across all pages

### Technical Stack
**Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
**Backend**: Next.js API Routes (Node.js)
**Deployment**: Vercel
**Auth**: None initially (add later)
**Storage**: Local file system for MVP

### MVP Scope
**In Scope**:
- All UI pages functional
- File upload working
- Mock AI responses (fake PDF generation, fake image enhancement)
- Navigation between pages
- Responsive design
- Demo-ready content

**Out of Scope** (for now):
- Real AI integration
- User authentication
- Database/cloud storage
- Payment processing
- User profiles

## Active Patterns

### Component Structure
```
components/
  ui/              # Reusable UI primitives
    Button.tsx
    Card.tsx
    Input.tsx
  layout/          # Layout components
    Header.tsx
    Footer.tsx
    Layout.tsx
  features/        # Feature-specific
    FileUpload.tsx
    DocumentGrid.tsx
    LoadingState.tsx
```

### File Naming
- **Components**: PascalCase (Button.tsx, FileUpload.tsx)
- **Utils**: camelCase (formatDate.ts, validateFile.ts)
- **Pages**: kebab-case folders (process-lecture/, enhance-whiteboard/)
- **Types**: PascalCase with .types.ts suffix (Document.types.ts)

### Import Aliases
```tsx
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils/formatDate'
import type { Document } from '@/types/Document.types'
```

## Important Learnings

### Next.js App Router Specifics
1. Server Components by default (use 'use client' when needed)
2. API routes in `app/api/*/route.ts`
3. Layout.tsx provides shared UI wrapper
4. Loading.tsx and error.tsx for automatic states
5. Metadata exported from page.tsx for SEO

### Tailwind Best Practices
1. Use custom colors from config, not arbitrary values
2. Consistent spacing scale (4px base: p-4, m-6, etc.)
3. Mobile-first responsive design (sm:, md:, lg: breakpoints)
4. Dark mode with `dark:` prefix
5. Group related utilities with @apply (sparingly)

### File Upload Handling
1. Client validates file type and size before upload
2. Server receives multipart/form-data
3. Files saved with unique IDs
4. Return file ID to client for processing
5. Clean up temp files after processing

## Project Insights

### Design Philosophy
- **Simplicity First**: Don't over-engineer the MVP
- **Student-Focused**: UI should feel approachable, not intimidating
- **Speed Matters**: Fast feedback, no waiting
- **Visual Hierarchy**: Clear primary actions on every page

### User Flow Priorities
1. **Dashboard**: Gateway to both main features + quick access to recent items
2. **Processing Pages**: Minimize steps, clear progress indicators
3. **Study Hub**: Easy browsing, fast search, clear organization
4. **Results**: Immediate satisfaction, clear next actions

### Technical Priorities
1. **Working Demo**: Better to have working mock than broken real integration
2. **Clean Code**: Write maintainable code from the start
3. **Type Safety**: TypeScript everywhere, no `any` types
4. **Performance**: Fast page loads, optimized images
5. **Responsive**: Mobile-friendly from day one

## Known Constraints

### Time Constraints
- **Presentation**: Tomorrow
- **Total MVP Time**: 4 weeks
- **Focus**: Get functional demo working quickly

### Technical Constraints
- No external API keys yet (Google Gemini, Vision)
- No cloud storage setup yet
- No authentication system yet
- Local development only for now

### Resource Constraints
- Solo developer
- Limited budget (free tier services)
- No design team (using provided HTML as reference)

## Questions to Resolve

### Near Term
- [ ] Should Study Hub persist data between sessions? (Use localStorage for now)
- [ ] How to generate fake PDFs for demo? (Use PDF-lib or pre-made samples)
- [ ] What sample content for demo? (Use realistic but fictional course names)

### Future
- [ ] Which auth provider? (Firebase Auth, Clerk, NextAuth.js)
- [ ] Which cloud storage? (AWS S3, Google Cloud Storage, Cloudinary)
- [ ] Database choice? (PostgreSQL via Supabase, or MongoDB)
- [ ] Payment integration? (Stripe)

## Development Notes

### Git Strategy
- Commit frequently with descriptive messages
- Push to GitHub after each major feature
- Main branch for production-ready code
- Feature branches for experimental work

### Code Quality
- ESLint + Prettier configured
- TypeScript strict mode enabled
- Component props interfaces required
- Async errors must be caught

### Performance Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: 90+

## Today's Goals Checklist
- [x] Create Memory Bank documentation
- [ ] Initialize Next.js project
- [ ] Set up Tailwind config with unified design system
- [ ] Create Header component
- [ ] Create Layout component
- [ ] Build Dashboard page
- [ ] Build Study Hub page
- [ ] Build Lecture Processor page
- [ ] Build Whiteboard Enhancer page
- [ ] Create file upload API
- [ ] Create mock processing APIs
- [ ] Test all flows
- [ ] Prepare demo content

## Tomorrow's Presentation Plan
1. Show homepage (Dashboard)
2. Demonstrate lecture upload flow (with mock processing)
3. Show generated study guide (pre-made PDF)
4. Demonstrate whiteboard enhancement (before/after)
5. Browse Study Hub library
6. Highlight future features (AI integration, auth, etc.)
