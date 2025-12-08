# CrammingAI - Smart Studying, Not Hard Studying

An intelligent educational platform that transforms lecture content (videos, slides, PDFs) into comprehensive study materials using Google Gemini AI and Imagen 3. Build custom mock exams, organize materials in folders, and ace your exams with AI-powered study tools.

## 🔒 SECURITY FIRST

**⚠️ CRITICAL**: Your API keys are sensitive credentials. Protect them!

### Setup Instructions

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your API keys to `.env.local`:**
   - Get Google Gemini key: https://aistudio.google.com/app/apikey
   - Get FAL.ai key: https://fal.ai/dashboard/keys

3. **NEVER commit `.env.local` to git** (already in .gitignore)

### If API Keys Were Exposed:
1. **Immediately revoke them** in Google Cloud Console / FAL.ai dashboard
2. Generate new keys
3. Update your local `.env.local`

---

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

Open http://localhost:3000

---

## Features

- 📹 Video transcription with AI
- 📄 PDF/PowerPoint slide extraction
- 🤖 AI-generated study materials (summaries, quizzes, exams)
- 🖼️ Automatic educational diagram generation
- ✨ Math/LaTeX rendering with KaTeX

---

**⚠️ API Usage**: This app makes paid API calls. Monitor your usage!
