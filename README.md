# CrammingAI - Smart Studying, Not Hard Studying

An intelligent educational platform that transforms lecture content (videos, slides, PDFs) into comprehensive study materials using Google Gemini AI and Imagen 3. Build custom mock exams, organize materials in folders, and ace your exams with AI-powered study tools.

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your API keys (see Security section below)

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Dev server auto-assigns ports if 3000 is occupied (will try 3001, 3002, etc.)

---

## 🎯 Key Features

- **📹 Multi-Format Input**: Upload videos, PDFs, slides, or photos from lectures
- **🤖 AI-Powered Generation**: Create summaries, practice exams, quizzes, and explanations
- **🖼️ Visual Enhancement**: Automatically generate educational diagrams with AI (Imagen 3)
- **📁 Smart Organization**: Folder system with nested hierarchy for organizing materials
- **✨ Rich Content Rendering**: Math equations (LaTeX/KaTeX), code blocks, and formatted content
- **🔒 User Authentication**: Secure Firebase authentication with quota management
- **📊 Usage Tracking**: Daily quotas and budget limits (free tier: 5 materials/day, $5 budget)

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 14.2 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore Admin SDK, Storage)
- **AI**: Google Gemini 1.5 (Pro/Flash), Imagen 3 via FAL.ai
- **Monitoring**: Sentry for error tracking and performance monitoring
- **Hosting**: Vercel

---

## 🔒 Security & Environment Setup

**⚠️ CRITICAL**: Your API keys are sensitive credentials. Protect them!

### Required API Keys

1. **Firebase** (Authentication & Database):
   - Project credentials from Firebase Console
   - Required: Admin SDK private key, client config

2. **Google Gemini AI** (Content Generation):
   - Get your key: [Google AI Studio](https://aistudio.google.com/app/apikey)

3. **FAL.ai** (Image Generation):
   - Get your key: [FAL.ai Dashboard](https://fal.ai/dashboard/keys)

4. **Sentry** (Error Monitoring):
   - Get your DSN: [Sentry.io](https://sentry.io)

### Environment File Setup

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and fill in all required keys
```

See `.env.local.example` for the complete list of required variables.

### If API Keys Were Exposed:

1. **Immediately revoke them** in respective dashboards
2. Generate new keys
3. Update your local `.env.local`
4. Rotate Firebase service account if compromised

**Never commit `.env.local` to git** (already in `.gitignore`)

---

## 📚 Development

### Available Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
npm run lint      # Run ESLint
```

### Project Structure

```
/app                 # Next.js App Router pages and API routes
  /api               # API endpoints (generate-materials, quizzes, etc.)
  /(landing)         # Landing page
  /create            # Material creation interface
  /hub               # Main dashboard/materials library
/components          # React components
  /auth              # Authentication components
  /folders           # Folder management
  /quiz              # Quiz-related components
  /ui                # Reusable UI primitives
  /contexts          # React contexts (AuthContext)
/lib                 # Core business logic
  /firebase          # Firebase SDK configurations
  /firestore         # Database repositories
  /middleware        # API middleware
  /types             # TypeScript type definitions
```

### Key Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive development guide, architecture, and best practices
- **[AGENTS.md](./AGENTS.md)** - Feature roadmap and task tracking
- **[Firestore Rules](./firestore.rules)** - Database security rules

---

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add all environment variables from `.env.local` to Vercel project settings
3. Deploy automatically on push to main branch

### Firebase Deployment

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

---

## 💰 API Usage & Costs

This app makes **paid API calls** to external services:

- **Google Gemini AI**: ~$0.001-0.02 per material generation
- **FAL.ai (Imagen 3)**: ~$0.05 per image generation

**Built-in Cost Controls:**
- Free tier: 5 materials/day, $5 daily budget
- Global platform limit: $50/day across all users
- Atomic quota system prevents race conditions

Monitor your usage in the Firebase console and respective API dashboards.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the code organization standards in [CLAUDE.md](./CLAUDE.md)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 🐛 Troubleshooting

### Common Issues

**Build Errors:**
- Ensure all environment variables are set in `.env.local`
- Run `npm install` to ensure dependencies are up to date
- Check Sentry for detailed error logs

**API Quota Exceeded:**
- Free tier limit: 5 materials/day
- Upgrade to premium or wait until midnight UTC for quota reset

**Firebase Authentication Issues:**
- Verify Firebase config in `.env.local`
- Check Firebase Console for authentication settings
- Ensure `authDomain` is correctly whitelisted

For detailed troubleshooting and architecture documentation, see [CLAUDE.md](./CLAUDE.md).
