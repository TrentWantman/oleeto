import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          DEFAULT: '#00ff41',
          dim: '#00cc33',
          dark: '#009926',
          muted: '#0a3d0a',
          glow: 'rgba(0, 255, 65, 0.15)',
        },
        surface: {
          DEFAULT: '#111111',
          raised: '#1a1a1a',
          overlay: '#222222',
        },
        border: {
          DEFAULT: '#1f2f1f',
          bright: '#2a4a2a',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 10px rgba(0, 255, 65, 0.3)',
        'neon-lg': '0 0 20px rgba(0, 255, 65, 0.4)',
      },
    },
  },
  plugins: [],
} satisfies Config
