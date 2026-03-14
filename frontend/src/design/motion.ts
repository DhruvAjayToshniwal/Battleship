export const ease = {
  default: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  drift: [0.16, 1, 0.3, 1] as [number, number, number, number],
  out: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
} as const

export const duration = {
  fast: 0.4,
  normal: 0.8,
  slow: 1.2,
  drift: 2.0,
  reveal: 1.6,
  intro: 2.0,
  camera: 3.0,
} as const

export const transition = {
  fadeIn: {
    duration: duration.slow,
    ease: ease.default,
  },
  fadeOut: {
    duration: duration.normal,
    ease: ease.default,
  },
  drift: {
    duration: duration.drift,
    ease: ease.drift,
  },
  reveal: {
    duration: duration.reveal,
    ease: ease.default,
  },
} as const

export const stagger = {
  fast: 0.08,
  normal: 0.15,
  slow: 0.25,
} as const
