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
        primary: {
          DEFAULT: '#1193d4',
          dark: '#0d7ab8',
          light: '#3da8de',
        },
        accent: {
          DEFAULT: '#14B8A6',
          dark: '#0f9b8e',
          light: '#2dd4bf',
        },
        background: {
          light: '#f6f7f8',
          dark: '#101c22',
        },
        card: {
          light: '#ffffff',
          dark: '#1F2937',
        },
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}

export default config
