import type { Metadata } from 'next'
import { Space_Grotesk, Manrope, Crimson_Pro, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Headings - geometric, distinctive, professional
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

// Body - refined, readable, professional
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

// Accent - scholarly, elegant serif
const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-accent',
  display: 'swap',
  weight: ['400', '600', '700'],
})

// Code - monospace with ligatures
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StudyScribe - AI-Powered Study Assistant',
  description: 'Transform lectures and notes into structured study materials with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${spaceGrotesk.variable} ${manrope.variable} ${crimsonPro.variable} ${jetbrainsMono.variable}`}>
        {/* Skip to main content link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
