'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserMenu from '@/components/auth/UserMenu'

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-oxford-blue/[0.08] shadow-sm backdrop-blur-xl bg-white/90 dark:bg-background-dark/90" role="banner">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-90 duration-200">
            <h1 className="text-2xl font-heading font-bold tracking-tight text-gradient-academic leading-none">
              CrammingAI
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <Link
              href="/hub"
              className={`
                relative px-4 py-2.5 rounded-lg text-[15px] font-semibold
                transition-all duration-200
                ${isActive('/hub')
                  ? 'bg-cerulean/10 text-cerulean'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-cerulean'
                }
              `}
            >
              Study Hub
              {isActive('/hub') && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-cerulean rounded-full" />
              )}
            </Link>
            <Link
              href="/transcribe"
              className={`
                relative px-4 py-2.5 rounded-lg text-[15px] font-semibold
                transition-all duration-200
                ${isActive('/transcribe')
                  ? 'bg-cerulean/10 text-cerulean'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-cerulean'
                }
              `}
            >
              Transcribe
              {isActive('/transcribe') && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-cerulean rounded-full" />
              )}
            </Link>
            <Link
              href="/exam-generator"
              className={`
                relative px-4 py-2.5 rounded-lg text-[15px] font-semibold
                transition-all duration-200
                ${isActive('/exam-generator')
                  ? 'bg-cerulean/10 text-cerulean'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-cerulean'
                }
              `}
            >
              Mock Exam
              {isActive('/exam-generator') && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-cerulean rounded-full" />
              )}
            </Link>
            <Link
              href="/materials"
              className={`
                relative px-4 py-2.5 rounded-lg text-[15px] font-semibold
                transition-all duration-200
                ${isActive('/materials')
                  ? 'bg-cerulean/10 text-cerulean'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-cerulean'
                }
              `}
            >
              For Instructors
              {isActive('/materials') && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-cerulean rounded-full" />
              )}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Primary CTA */}
            <Link
              href="/create"
              className="
                hidden sm:flex items-center gap-2
                px-5 py-2.5 rounded-lg
                bg-primary hover:bg-primary-dark
                text-white text-[14px] font-semibold
                transition-all duration-250
                hover:shadow-[0_4px_12px_rgba(3,64,120,0.24)]
                hover:-translate-y-0.5
                active:translate-y-0
              "
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Create Material</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-primary/[0.06] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="material-symbols-outlined text-oxford-blue">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-background-dark border-b border-oxford-blue/[0.08] shadow-lg animate-slide-down">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <Link
                href="/hub"
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  px-4 py-3 rounded-lg text-[15px] font-semibold text-left
                  transition-all duration-200
                  ${isActive('/hub')
                    ? 'bg-cerulean/10 text-cerulean border-l-4 border-cerulean'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-cerulean'
                  }
                `}
              >
                Study Hub
              </Link>
              <Link
                href="/transcribe"
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  px-4 py-3 rounded-lg text-[15px] font-semibold text-left
                  transition-all duration-200
                  ${isActive('/transcribe')
                    ? 'bg-cerulean/10 text-cerulean border-l-4 border-cerulean'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-cerulean'
                  }
                `}
              >
                Transcribe
              </Link>
              <Link
                href="/exam-generator"
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  px-4 py-3 rounded-lg text-[15px] font-semibold text-left
                  transition-all duration-200
                  ${isActive('/exam-generator')
                    ? 'bg-cerulean/10 text-cerulean border-l-4 border-cerulean'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-cerulean'
                  }
                `}
              >
                Mock Exam
              </Link>
              <Link
                href="/materials"
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  px-4 py-3 rounded-lg text-[15px] font-semibold text-left
                  transition-all duration-200
                  ${isActive('/materials')
                    ? 'bg-cerulean/10 text-cerulean border-l-4 border-cerulean'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-cerulean'
                  }
                `}
              >
                For Instructors
              </Link>
              <Link
                href="/create"
                onClick={() => setMobileMenuOpen(false)}
                className="
                  flex items-center gap-2 justify-center
                  px-5 py-3 rounded-lg mt-2
                  bg-primary hover:bg-primary-dark
                  text-white text-[14px] font-semibold
                  transition-all duration-200
                "
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Create Material</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
