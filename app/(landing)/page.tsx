'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-mesh-academic dark:bg-mesh-academic-dark texture-noise">
      {/* Header */}
      <header className="glass dark:glass-dark border-b border-border-light dark:border-border-dark sticky top-0 z-50 shadow-sm backdrop-blur-lg" role="banner">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-bold text-gradient-academic">
              LectureHelper AI
            </h1>
            <nav aria-label="Main navigation">
              <div className="flex gap-3">
                <Link
                  href="/materials"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2 font-semibold"
                  aria-label="Upload course materials (for instructors)"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">upload</span>
                  <span className="hidden md:inline">Instructors: Upload Materials</span>
                  <span className="md:hidden">Upload</span>
                </Link>
                <Link
                  href="/hub"
                  className="px-4 py-2 bg-accent hover:bg-accent-dark text-midnight-blue rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2 font-semibold"
                  aria-label="View your study hub"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">folder</span>
                  <span className="hidden md:inline">Study Hub</span>
                  <span className="md:hidden">Hub</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4" role="main">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="min-h-[85vh] flex flex-col justify-center items-center text-center">
            <div className="bg-mesh-hero dark:bg-mesh-academic-dark rounded-3xl p-16 md:p-20 pattern-dots animate-scale-in max-w-4xl">
              <h2 className="text-5xl md:text-7xl font-heading font-bold text-oxford-blue dark:text-text-dark mb-6 animate-slide-up" style={{animationDelay: '100ms'}}>
                Transform Your Lectures into <span className="text-gradient-accent">Study Materials</span>
              </h2>
              <p className="text-xl md:text-2xl text-text-muted dark:text-text-dark-muted max-w-3xl mx-auto mb-12 animate-fade-in leading-relaxed" style={{animationDelay: '200ms'}}>
                Upload audio, slides, and photos to generate comprehensive study guides powered by AI
              </p>

              {/* Progress Steps Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 animate-fade-in" style={{animationDelay: '300ms'}}>
                <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 card-interactive border-2 border-primary/20 hover:border-primary/50 transition-all">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-3xl text-primary">cloud_upload</span>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-oxford-blue dark:text-text-dark mb-2">Upload</h3>
                    <p className="text-sm text-text-muted dark:text-text-dark-muted text-center">
                      Add lecture recordings, slides, or photos
                    </p>
                  </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 card-interactive border-2 border-cerulean/20 hover:border-cerulean/50 transition-all">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-cerulean/10 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-3xl text-cerulean">category</span>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-oxford-blue dark:text-text-dark mb-2">Choose Type</h3>
                    <p className="text-sm text-text-muted dark:text-text-dark-muted text-center">
                      Select exam prep, summary, quiz, or custom
                    </p>
                  </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 card-interactive border-2 border-accent/20 hover:border-accent/50 transition-all">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-3xl text-accent-dark">autorenew</span>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-oxford-blue dark:text-text-dark mb-2">AI Processing</h3>
                    <p className="text-sm text-text-muted dark:text-text-dark-muted text-center">
                      We analyze and generate your materials
                    </p>
                  </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 card-interactive border-2 border-success/20 hover:border-success/50 transition-all">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-3xl text-success">task_alt</span>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-oxford-blue dark:text-text-dark mb-2">Study & Save</h3>
                    <p className="text-sm text-text-muted dark:text-text-dark-muted text-center">
                      Review, download, and save to your hub
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="animate-fade-in" style={{animationDelay: '400ms'}}>
                <Link href="/create">
                  <button className="btn-primary text-xl py-5 px-12 pulse-glow-cta btn-magnetic text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 mx-auto">
                    <span>Get Started</span>
                    <span className="material-symbols-outlined text-2xl" aria-hidden="true">arrow_forward</span>
                  </button>
                </Link>
                <p className="text-sm text-text-muted dark:text-text-dark-muted mt-4">
                  No account required - start creating study materials instantly
                </p>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-20">
            <h3 className="text-3xl md:text-4xl font-heading font-bold text-center text-oxford-blue dark:text-text-dark mb-12">
              Why Choose LectureHelper AI?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-card-light dark:bg-card-dark rounded-xl p-8 card hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl text-primary">smart_toy</span>
                </div>
                <h4 className="text-xl font-heading font-bold text-oxford-blue dark:text-text-dark mb-3">AI-Powered</h4>
                <p className="text-text-muted dark:text-text-dark-muted">
                  Advanced AI analyzes your lectures and generates tailored study materials that match your learning style.
                </p>
              </div>

              <div className="bg-card-light dark:bg-card-dark rounded-xl p-8 card hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-lg bg-cerulean/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl text-cerulean">bolt</span>
                </div>
                <h4 className="text-xl font-heading font-bold text-oxford-blue dark:text-text-dark mb-3">Lightning Fast</h4>
                <p className="text-text-muted dark:text-text-dark-muted">
                  Get comprehensive study materials in minutes, not hours. Focus on learning, not note-taking.
                </p>
              </div>

              <div className="bg-card-light dark:bg-card-dark rounded-xl p-8 card hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl text-accent-dark">tune</span>
                </div>
                <h4 className="text-xl font-heading font-bold text-oxford-blue dark:text-text-dark mb-3">Fully Customizable</h4>
                <p className="text-text-muted dark:text-text-dark-muted">
                  Generate exam prep, summaries, quizzes, or create custom materials with your own prompts.
                </p>
              </div>
            </div>

            {/* Secondary CTA */}
            <div className="text-center">
              <Link href="/create">
                <button className="btn-secondary text-lg py-4 px-10 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                  Start Creating Study Materials
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-light dark:border-border-dark py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-text-muted dark:text-text-dark-muted">
            &copy; 2024 LectureHelper AI. Empowering students with AI-driven learning tools.
          </p>
        </div>
      </footer>
    </div>
  );
}
