# System Patterns: StudyScribe

## Architecture Overview

### System Design
StudyScribe follows a modern full-stack architecture using Next.js for both frontend and backend:

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Dashboard  │  │  Study Hub  │  │  Processors │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App (Server)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  UI Routes  │  │  API Routes │  │   Storage   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services (Future)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Gemini    │  │  Vision API │  │Cloud Storage│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

### 1. Next.js App Router
**Decision**: Use Next.js 14 App Router instead of Pages Router
**Rationale**:
- Modern React Server Components
- Simplified data fetching
- Built-in API routes
- Better SEO and performance
- Collocated API and UI code

### 2. TypeScript Throughout
**Decision**: Use TypeScript for all code
**Rationale**:
- Type safety prevents bugs
- Better IDE support
- Easier refactoring
- Self-documenting code

### 3. Tailwind CSS for Styling
**Decision**: Use Tailwind instead of CSS-in-JS
**Rationale**:
- Rapid development
- Consistent design system
- Small bundle size
- Easy theming (light/dark mode)
- No runtime cost

### 4. File-Based Routing
**Decision**: Use Next.js file-based routing
**Rationale**:
- Automatic route creation
- Code organization matches URL structure
- Easy to understand and maintain

### 5. Server Actions (Future)
**Decision**: Use Next.js Server Actions for mutations
**Rationale**:
- No separate API layer needed for simple operations
- Type-safe client-server communication
- Progressive enhancement

## Design Patterns

### Component Architecture

#### Atomic Design Principles
```
atoms/        → Buttons, Inputs, Icons
molecules/    → Cards, Form Fields, Search Bars
organisms/    → Header, File Upload, Document Grid
templates/    → Page layouts
pages/        → Full pages (in app/ directory)
```

#### Component Structure
```tsx
// Standard component pattern
interface ComponentProps {
  // Props with types
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks
  // 2. Derived state
  // 3. Event handlers
  // 4. Effects (if needed)
  // 5. Render

  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### State Management

#### MVP Phase: React State + URL State
- **Local State**: `useState` for component-specific state
- **URL State**: Search params for filters, selections
- **Server State**: Next.js cache for API data
- **No Global State**: Keep it simple initially

#### Future: Consider
- Zustand for global client state
- React Query for server state management
- Context API for theme, user preferences

### Data Flow

#### Lecture Processing Flow
```
1. User uploads file
   ↓
2. Client validates file (size, type)
   ↓
3. POST to /api/upload
   ↓
4. Server saves file, returns ID
   ↓
5. Client POSTs to /api/process-lecture with ID + options
   ↓
6. Server processes (mock for MVP)
   ↓
7. Server generates PDF
   ↓
8. Server returns PDF URL
   ↓
9. Client displays result + saves to Study Hub
```

#### Whiteboard Enhancement Flow
```
1. User uploads image
   ↓
2. Client validates image (size, type)
   ↓
3. POST to /api/upload
   ↓
4. Server saves image, returns ID
   ↓
5. Client POSTs to /api/enhance-image with ID
   ↓
6. Server enhances image (mock for MVP)
   ↓
7. Server performs OCR (mock for MVP)
   ↓
8. Server returns enhanced image URL + extracted text
   ↓
9. Client displays before/after + text
```

### File Upload Pattern

#### Client-Side
```tsx
const handleUpload = async (file: File) => {
  // 1. Validate
  if (!validateFile(file)) return

  // 2. Create FormData
  const formData = new FormData()
  formData.append('file', file)

  // 3. Upload
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })

  // 4. Handle response
  const { fileId } = await response.json()
  return fileId
}
```

#### Server-Side
```ts
// API route: /api/upload/route.ts
export async function POST(request: Request) {
  // 1. Parse form data
  const formData = await request.formData()
  const file = formData.get('file')

  // 2. Validate
  if (!isValidFile(file)) {
    return Response.json({ error: 'Invalid file' }, { status: 400 })
  }

  // 3. Save file
  const fileId = await saveFile(file)

  // 4. Return response
  return Response.json({ fileId })
}
```

## Critical Implementation Paths

### Path 1: Dashboard → Lecture Processing → Result
1. User clicks "Process a New Lecture"
2. Navigate to `/process-lecture`
3. Upload file
4. Select AI features
5. Submit for processing
6. Show loading state
7. Redirect to result page
8. Display generated PDF
9. Option to save to Study Hub

### Path 2: Dashboard → Whiteboard Enhancement → Result
1. User clicks "Enhance a Whiteboard Snap"
2. Navigate to `/enhance-whiteboard`
3. Upload image
4. Process image
5. Show loading state
6. Display before/after comparison
7. Show extracted text
8. Option to copy text and save

### Path 3: Study Hub → View/Download Document
1. User clicks "My Study Hub"
2. Navigate to `/hub`
3. Display grid of documents
4. User can search/filter
5. Click document to view/download
6. Options to rename or delete

## Component Relationships

### Layout Hierarchy
```
RootLayout
├── Header (on all pages)
│   ├── Logo
│   ├── Navigation
│   └── UserMenu (future)
├── Page Content
│   └── (page-specific components)
└── Footer (optional)
```

### Shared Components
- **Header**: Navigation, logo, theme toggle
- **Button**: Variants (primary, secondary, ghost)
- **Card**: Document cards, action cards
- **FileUpload**: Drag & drop + browse
- **LoadingSpinner**: Processing states
- **Modal**: Confirmations, previews

## Error Handling

### Client-Side
```tsx
try {
  const result = await processLecture(file, options)
  showSuccess('Lecture processed successfully!')
} catch (error) {
  showError(error.message)
  logError(error)
}
```

### Server-Side
```ts
export async function POST(request: Request) {
  try {
    // Process request
    return Response.json({ success: true })
  } catch (error) {
    console.error('Processing error:', error)
    return Response.json(
      { error: 'Failed to process lecture' },
      { status: 500 }
    )
  }
}
```

## Performance Patterns

### Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/path/to/image"
  width={500}
  height={300}
  alt="Description"
  loading="lazy"
/>
```

### Code Splitting
```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />
})
```

### Caching Strategy
- Static pages: Cache forever, revalidate on deploy
- API responses: Cache for 5 minutes (stale-while-revalidate)
- User uploads: No caching

## Testing Strategy (Future)

### Unit Tests
- Utility functions
- Component logic
- API route handlers

### Integration Tests
- API endpoints
- File upload flow
- AI processing pipeline

### E2E Tests
- Critical user paths
- Full lecture processing flow
- Whiteboard enhancement flow

## Deployment Strategy

### Vercel Configuration
```javascript
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]  // US East
}
```

### Environment Variables
```bash
# .env.local (development)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# .env.production (Vercel)
NEXT_PUBLIC_APP_URL=https://studyscribe.vercel.app
GEMINI_API_KEY=xxx
GOOGLE_CLOUD_API_KEY=xxx
```

## Scalability Considerations (Future)

### When to Add Database
- User accounts needed
- Persistent storage required
- Complex queries needed
- Multiple relationships

### When to Add Queue System
- Long-running AI processing
- High volume of uploads
- Need for retry logic
- Background jobs

### When to Add CDN
- Serving large files
- Global user base
- High traffic volume
- Performance critical
