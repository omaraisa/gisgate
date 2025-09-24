import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#3A5339',
          500: '#293F28',
          600: '#1F311E',
          700: '#152315',
        },
        secondary: {
          400: '#D4FF33',
          500: '#ADD900',
          600: '#8BB500',
          700: '#699100',
        },
        background: {
          DEFAULT: '#0F1310',
          secondary: '#1A1F1A',
          tertiary: '#242A24',
        },
        foreground: {
          DEFAULT: '#F5F7F5',
          secondary: '#E8EAE8',
          muted: '#B8C2B8',
        },
        surface: {
          DEFAULT: '#1A1F1A',
          elevated: '#242A24',
          hover: '#2E332E',
        },
        border: {
          DEFAULT: '#293F28',
          hover: '#3A5339',
          focus: '#ADD900',
        }
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-arabic)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
