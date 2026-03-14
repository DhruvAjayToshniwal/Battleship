export const colors = {
  bg: {
    void: '#0a0a0a',
    deep: '#111111',
    surface: '#1a1a1a',
    elevated: '#222222',
  },
  text: {
    primary: '#e8e8e8',
    secondary: '#888888',
    tertiary: '#555555',
    ghost: '#333333',
  },
  border: {
    hairline: '#222222',
    subtle: '#333333',
    emphasis: '#555555',
  },
  accent: {
    cyan: '#4a9ead',
    cyanGlow: 'rgba(74, 158, 173, 0.15)',
    red: '#8b3a3a',
    redGlow: 'rgba(139, 58, 58, 0.15)',
    silver: '#c0c0c0',
    warmWhite: '#d4c5a9',
  },
  state: {
    hit: '#8b3a3a',
    miss: '#4a6a7a',
    sunk: '#6b2a2a',
  },
  player: '#4a9ead',
  enemy: '#8b3a3a',
} as const

export const overlay = {
  backdrop: 'rgba(10, 10, 10, 0.92)',
  panel: 'rgba(10, 10, 10, 0.7)',
} as const
