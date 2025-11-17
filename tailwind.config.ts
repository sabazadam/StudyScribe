import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Academic Heritage Color System
        'midnight-blue': '#0A1128',
        'oxford-blue': '#001F54',
        'prussian-blue': '#034078',
        'cerulean': '#1282A2',
        'amber': '#FEFCBF',
        'gold': '#D4AF37',

        // Semantic color mapping
        primary: {
          DEFAULT: '#034078', // Prussian Blue
          dark: '#001F54',    // Oxford Blue
          light: '#1282A2',   // Cerulean
          50: '#E6F2F7',
          100: '#CCE5EF',
          200: '#99CBE0',
          300: '#66B1D0',
          400: '#3397C1',
          500: '#034078',
          600: '#023360',
          700: '#022648',
          800: '#011A30',
          900: '#010D18',
        },
        accent: {
          DEFAULT: '#D4AF37',  // Gold
          dark: '#B8941E',
          light: '#E6C968',
          50: '#FBF8ED',
          100: '#F7F1DB',
          200: '#EFE3B7',
          300: '#E7D593',
          400: '#DFC76F',
          500: '#D4AF37',
          600: '#B8941E',
          700: '#8A6F17',
          800: '#5C4A0F',
          900: '#2E2508',
        },
        background: {
          light: '#FFFEF2',     // Warm paper white
          DEFAULT: '#F8F6E8',   // Slight cream tint
          dark: '#0A1128',      // Midnight Blue
        },
        card: {
          light: '#FFFFFF',
          DEFAULT: '#FAFAF8',
          dark: '#162038',      // Slightly lighter than midnight
          'dark-elevated': '#1F2D47',
        },
        text: {
          light: '#1A1A1A',
          DEFAULT: '#333333',
          muted: '#6B7280',
          dark: '#E5E7EB',
          'dark-muted': '#9CA3AF',
        },
        border: {
          light: '#E5E7EB',
          DEFAULT: '#D1D5DB',
          dark: '#374151',
        },
        // Functional colors
        success: {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#34D399',
        },
        warning: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          light: '#FBBF24',
        },
        error: {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
          light: '#F87171',
        },
        info: {
          DEFAULT: '#1282A2',  // Cerulean
          dark: '#034078',     // Prussian Blue
          light: '#3B9CB8',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        accent: ['var(--font-accent)', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
        // Keep display as alias for backward compatibility
        display: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}

export default config
