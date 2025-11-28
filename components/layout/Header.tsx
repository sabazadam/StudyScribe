'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="glass dark:glass-dark border-b border-border-light dark:border-border-dark sticky top-0 z-50 shadow-sm backdrop-blur-lg" role="banner">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-heading font-bold text-gradient-academic">
                LectureHelper AI
              </h1>
            </Link>
          </div>

          {/* Actions */}
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
  )
}
