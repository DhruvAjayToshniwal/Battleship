export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  huge: 64,
  vast: 96,
  enormous: 128,
} as const

export const gap = {
  tight: space.sm,
  normal: space.md,
  loose: space.lg,
  spacious: space.xxl,
} as const
