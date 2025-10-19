# StudyScribe

An AI-powered study assistant that transforms lecture materials and whiteboard photos into structured study aids.

## 🚀 Project Status

**MVP Progress**: ✅ Complete and ready for presentation!

## 📋 Features

### 1. Dashboard
- Welcome screen with quick access to main features
- Two primary action cards (Process Lecture, Enhance Whiteboard)
- Recent items from Study Hub
- Clean, modern UI with dark mode support

### 2. Lecture Processor (`/process-lecture`)
- Drag & drop file upload for audio/video
- Supported formats: MP3, MP4, WAV, MOV
- Customizable AI features:
  - Brief summary
  - Detailed concept explanations
  - Practice quiz generation
- Mock processing with loading states
- Generates consolidated PDF study guide

### 3. Whiteboard Enhancer (`/enhance-whiteboard`)
- Image upload for whiteboard/note photos
- Before/after comparison view
- AI-powered image enhancement (simulated)
- OCR text extraction (simulated)
- Copy extracted text
- Save and download options

### 4. Study Hub (`/hub`)
- Personal library of all generated materials
- Search functionality
- Filter by type (lectures vs. images)
- Grid view with document cards
- Hover actions: download, rename, delete
- Empty state with CTA

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Material Symbols (Google)
- **Font**: Inter
- **Deployment**: Vercel-ready

## 🎨 Design System

### Colors
- **Primary**: `#1193d4` (Blue) - Trust, intelligence, learning
- **Accent**: `#14B8A6` (Teal) - Energy, creativity
- **Background Light**: `#f6f7f8`
- **Background Dark**: `#101c22`

### Components
- Unified Header with navigation
- Reusable Button, Card, LoadingSpinner components
- Consistent spacing and typography
- Full dark mode support

## 📁 Project Structure

```
website/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Dashboard
│   ├── hub/                     # Study Hub
│   ├── process-lecture/         # Lecture Processor
│   ├── enhance-whiteboard/      # Whiteboard Enhancer
│   ├── api/                     # API Routes (placeholders)
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   └── ui/                      # UI primitives
│       ├── Button.tsx
│       ├── Card.tsx
│       └── LoadingSpinner.tsx
├── memory-bank/                 # Project documentation
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── techContext.md
│   ├── systemPatterns.md
│   ├── activeContext.md
│   └── progress.md
├── public/                      # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## 🎯 Demo Flow for Presentation

1. **Start at Dashboard** - Show clean, modern homepage
2. **Lecture Processing**:
   - Navigate to "Process a New Lecture"
   - Upload an audio/video file (drag & drop demo)
   - Select AI features (checkboxes)
   - Click "Generate Study Guide"
   - Show loading state
   - Display success message
3. **Whiteboard Enhancement**:
   - Navigate to "Enhance a Whiteboard Snap"
   - Upload a whiteboard photo
   - Click "Enhance & Extract Text"
   - Show before/after comparison
   - Display extracted text
   - Demo copy text function
4. **Study Hub**:
   - Navigate to "My Study Hub"
   - Show grid of documents
   - Demo search functionality
   - Demo filter dropdown
   - Show hover actions

## 📝 Current Status

### ✅ Completed
- [x] Complete project setup with Next.js, TypeScript, Tailwind
- [x] Unified design system
- [x] All shared components (Header, Layout, Button, Card)
- [x] Dashboard page with action cards
- [x] Study Hub with search and filter
- [x] Lecture Processor with file upload
- [x] Whiteboard Enhancer with before/after
- [x] Placeholder API routes
- [x] Responsive design
- [x] Dark mode support
- [x] Memory Bank documentation

### 🔮 Future Development

#### Phase 1: Core Functionality
- [ ] Real file upload to storage
- [ ] Google Gemini API integration for text processing
- [ ] Google Cloud Vision API for OCR
- [ ] PDF generation library integration
- [ ] Image enhancement algorithms

#### Phase 2: User Features
- [ ] User authentication (Firebase/Clerk)
- [ ] User profiles and settings
- [ ] Persistent storage in database
- [ ] Real-time processing status
- [ ] Email notifications

#### Phase 3: Premium Features
- [ ] Subscription plans (Stripe)
- [ ] Usage limits and quotas
- [ ] Advanced AI features
- [ ] Collaboration tools
- [ ] Export integrations (Notion, Anki, Quizlet)

#### Phase 4: Scale & Polish
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Analytics integration
- [ ] Error tracking (Sentry)
- [ ] Mobile app (React Native)

## 🌟 Key Achievements

1. **Rapid Development**: Full MVP built in one day
2. **Professional UI**: Clean, modern design with consistent patterns
3. **User-Friendly**: Intuitive navigation and clear user flows
4. **Scalable Architecture**: Well-structured codebase ready for expansion
5. **Comprehensive Documentation**: Memory Bank system for project continuity

## 📚 Documentation

All project documentation is maintained in the `memory-bank/` directory:
- **projectbrief.md**: Core vision and goals
- **productContext.md**: User experience and design philosophy
- **techContext.md**: Technical stack and setup
- **systemPatterns.md**: Architecture and design patterns
- **activeContext.md**: Current work and decisions
- **progress.md**: What's done and what's next

## 🤝 Contributing

This is currently a solo project for educational/startup validation purposes.

## 📄 License

Private project - All rights reserved

## 👤 Author

**Kerem Bozdağ**
- Project: Class project + Startup idea
- Timeline: 4 weeks for full MVP
- Presentation: Ready for demo

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
