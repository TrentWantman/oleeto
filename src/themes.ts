export interface Theme {
  id: string
  name: string
  bg: string
  surface: string
  surfaceRaised: string
  border: string
  accent: string
  text: string
  textMuted: string
  textDim: string
}

export const themes: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    bg: '#0a0a0a',
    surface: '#111111',
    surfaceRaised: '#1a1a1a',
    border: '#1f2f1f',
    accent: '#00ff41',
    text: '#e0e0e0',
    textMuted: '#808080',
    textDim: '#4a4a4a',
  },
  {
    id: 'daylight',
    name: 'Daylight',
    bg: '#f5f5f0',
    surface: '#ffffff',
    surfaceRaised: '#eaeae5',
    border: '#d0d0c8',
    accent: '#16a34a',
    text: '#1a1a1a',
    textMuted: '#6b6b6b',
    textDim: '#a0a0a0',
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    bg: '#002b36',
    surface: '#073642',
    surfaceRaised: '#0a4050',
    border: '#2a5e6b',
    accent: '#2aa198',
    text: '#93a1a1',
    textMuted: '#657b83',
    textDim: '#586e75',
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    bg: '#fdf6e3',
    surface: '#eee8d5',
    surfaceRaised: '#e4ddc8',
    border: '#d3cbb7',
    accent: '#2aa198',
    text: '#073642',
    textMuted: '#586e75',
    textDim: '#93a1a1',
  },
]

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r} ${g} ${b}`
}

let current: Theme = themes[0]

export function getCurrentTheme(): Theme {
  return current
}

export function isLightTheme(theme: Theme): boolean {
  const [r, g, b] = hexToRgb(theme.bg).split(' ').map(Number)
  return (r + g + b) / 3 > 128
}

export function applyTheme(theme: Theme) {
  current = theme
  const root = document.documentElement
  root.style.setProperty('--bg', hexToRgb(theme.bg))
  root.style.setProperty('--surface', hexToRgb(theme.surface))
  root.style.setProperty('--surface-raised', hexToRgb(theme.surfaceRaised))
  root.style.setProperty('--border', hexToRgb(theme.border))
  root.style.setProperty('--accent', hexToRgb(theme.accent))
  root.style.setProperty('--accent-glow', hexToRgb(theme.accent))
  root.style.setProperty('--text', hexToRgb(theme.text))
  root.style.setProperty('--text-muted', hexToRgb(theme.textMuted))
  root.style.setProperty('--text-dim', hexToRgb(theme.textDim))
  window.dispatchEvent(new CustomEvent('theme-change'))
}

export function getTheme(id: string): Theme {
  return themes.find(t => t.id === id) ?? themes[0]
}
