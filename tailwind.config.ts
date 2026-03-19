import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          DEFAULT: '#00ff41',
        },
        surface: {
          DEFAULT: '#111111',
          raised: '#1a1a1a',
        },
        border: {
          DEFAULT: '#1f2f1f',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 10px rgba(0, 255, 65, 0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config
