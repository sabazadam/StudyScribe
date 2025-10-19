# Technical Context: StudyScribe

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Material Symbols (Google Icons)
- **Font**: Inter (Google Fonts)

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **File Handling**: Node.js fs module (initially), Multer for uploads
- **Storage**: Local file system (MVP), transition to cloud later

### AI Services (Future Integration)
- **Primary**: Google Gemini API (text generation, summarization, quiz creation)
- **Image Processing**: Google Cloud Vision API (OCR, image enhancement)
- **Alternative**: Claude/GPT-4 for PDF generation (if needed)

### Deployment
- **Platform**: Vercel
- **Domain**: TBD
- **CI/CD**: GitHub + Vercel auto-deploy
- **Environment Variables**: Vercel environment management

## Development Environment

### Required Tools
- Node.js (v18+ recommended)
- npm or yarn
- Git
- VS Code (recommended)
- Vercel CLI (optional)

### Project Structure
```
website/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Dashboard (/)
│   ├── hub/               # Study Hub (/hub)
│   ├── process-lecture/   # Lecture Processor (/process-lecture)
│   ├── enhance-whiteboard/ # Whiteboard Enhancer (/enhance-whiteboard)
│   ├── api/               # API Routes
│   │   ├── upload/
│   │   ├── process-lecture/
│   │   └── enhance-image/
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # UI primitives
│   ├── layout/           # Layout components (Header, Footer)
│   └── features/         # Feature-specific components
├── lib/                   # Utility functions
│   ├── ai/               # AI service integrations (future)
│   ├── storage/          # File storage utilities
│   └── utils/            # General utilities
├── types/                 # TypeScript type definitions
├── public/               # Static assets
│   ├── images/
│   └── demo/             # Demo files for presentation
├── memory-bank/          # Project documentation
└── uploads/              # Uploaded files (gitignored)
```

## Technical Constraints

### MVP Phase
1. **No Authentication**: Skip user accounts initially
2. **Local Storage**: Files stored locally, not in cloud
3. **Mock AI**: Use fake/sample responses instead of real AI API calls
4. **No Database**: Use JSON files or in-memory storage for demo
5. **Limited File Size**: Max 50MB uploads initially

### Future Requirements
1. **Authentication**: Add Firebase Auth or NextAuth.js
2. **Cloud Storage**: Migrate to AWS S3, Google Cloud Storage, or Firebase Storage
3. **Database**: PostgreSQL (Supabase) or MongoDB for user data
4. **Real AI**: Integrate Google Gemini and Vision APIs
5. **Payment**: Stripe for subscriptions

## Dependencies

### Core Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0"
}
```

### UI Dependencies
```json
{
  "tailwindcss": "^3.4.0",
  "autoprefixer": "^10.4.0",
  "postcss": "^8.4.0"
}
```

### Utility Dependencies (Future)
```json
{
  "axios": "^1.6.0",           // API requests
  "multer": "^1.4.5",          // File uploads
  "pdf-lib": "^1.17.1",        // PDF generation
  "sharp": "^0.33.0",          // Image processing
  "@google/generative-ai": "^latest",  // Gemini SDK
  "@google-cloud/vision": "^latest"    // Vision API
}
```

## Development Workflow

### Initial Setup
1. Clone/initialize repository
2. Run `npm install`
3. Copy `.env.local.example` to `.env.local`
4. Run `npm run dev`
5. Open http://localhost:3000

### Git Workflow
- Main branch for production-ready code
- Feature branches for development
- Commit frequently with clear messages
- Push to GitHub regularly

### Deployment Workflow
1. Push to GitHub
2. Vercel auto-deploys from main branch
3. Preview deployments for pull requests
4. Environment variables configured in Vercel dashboard

## Configuration Files

### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com'], // For demo images
  },
}

module.exports = nextConfig
```

### `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1193d4',
        'primary-dark': '#0d7ab8',
        accent: '#14B8A6',
        'accent-dark': '#0f9b8e',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Performance Considerations
- Use Next.js Image component for optimized images
- Implement lazy loading for heavy components
- Server-side rendering for initial load speed
- Code splitting by route
- Compress uploaded files before storage

## Security Considerations (Future)
- Validate all file uploads (type, size, content)
- Sanitize user inputs
- Rate limiting on API routes
- CORS configuration
- Environment variable security
- API key rotation

## Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile: iOS Safari, Chrome Android
