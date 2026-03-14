export const fontFamily = {
  serif: "'Cormorant Garamond', 'Georgia', serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
} as const

export const fontSize = {
  display: '48px',
  title: '24px',
  body: '14px',
  caption: '11px',
  data: '12px',
} as const

export const fontWeight = {
  light: 300,
  regular: 400,
  semibold: 600,
} as const

export const tracking = {
  display: '0.25em',
  title: '0.15em',
  body: '0.05em',
  caption: '0.2em',
  data: '0.1em',
  wide: '0.3em',
} as const

export const textStyle = {
  display: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.display,
    fontWeight: fontWeight.light,
    letterSpacing: tracking.display,
    textTransform: 'uppercase' as const,
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.title,
    fontWeight: fontWeight.regular,
    letterSpacing: tracking.title,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    letterSpacing: tracking.body,
  },
  caption: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.light,
    letterSpacing: tracking.caption,
    textTransform: 'uppercase' as const,
  },
  data: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.data,
    fontWeight: fontWeight.regular,
    letterSpacing: tracking.data,
  },
} as const
