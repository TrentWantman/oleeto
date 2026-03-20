import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: 'rgb(var(--accent) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
        },
        gray: {
          100: 'rgb(var(--text))',
          200: 'rgb(var(--text))',
          300: 'rgb(var(--text) / 0.85)',
          400: 'rgb(var(--text-muted))',
          500: 'rgb(var(--text-muted))',
          600: 'rgb(var(--text-dim))',
          700: 'rgb(var(--text-dim) / 0.6)',
          800: 'rgb(var(--text-dim) / 0.3)',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 10px rgb(var(--accent-glow) / 0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config
