export const COLORS = {
  ocean: {
    deep: 0x0a1628,
    surface: 0x0d4f6b,
    foam: 0xc8e6ef,
    shallow: 0x1a7a8a,
    midtone: 0x0e3b5e,
  },
  board: {
    playerPrimary: 0x00e5ff,
    playerSecondary: 0x006080,
    enemyPrimary: 0xff1744,
    enemySecondary: 0x801020,
    neutral: 0x334455,
    gridLine: 0x1a3a5a,
  },
  sky: {
    zenith: 0x020810,
    horizon: 0x0a1e3d,
    moon: 0xe8e0d0,
    stars: 0xffffff,
  },
  effects: {
    hit: 0xff4400,
    miss: 0x4488ff,
    sunk: 0xff0033,
    select: 0x00ffcc,
    hover: 0x44ccff,
    explosion: 0xff6600,
    muzzleFlash: 0xffdd44,
    smoke: 0x888888,
    wake: 0xaaddee,
  },
  ui: {
    textPrimary: 0xeeffff,
    textSecondary: 0x88aacc,
    panelBackground: 0x0a1520,
    panelBorder: 0x1a3a5a,
  },
} as const;

export const GLOW = {
  none: 0.0,
  subtle: 0.3,
  low: 0.5,
  medium: 1.0,
  high: 1.5,
  intense: 2.5,
  blinding: 4.0,
  bloom: {
    strength: 0.8,
    radius: 0.4,
    threshold: 0.6,
  },
} as const;

export const TIMING = {
  oceanCycle: 12.0,
  radarSweep: 3.0,
  radarPulse: 2.0,
  boardPulse: 2.5,
  reticleSpin: 4.0,
  reticleLock: 0.6,
  hitFlash: 0.3,
  explosionDuration: 1.5,
  smokeFade: 3.0,
  wakeTrail: 2.0,
  cameraTransition: 1.2,
  turnTransition: 0.8,
  phaseTransition: 1.0,
  hoverFade: 0.2,
  selectionPulse: 1.5,
} as const;

export const MATERIALS = {
  ocean: {
    roughness: 0.15,
    metalness: 0.6,
    opacity: 0.92,
  },
  board: {
    roughness: 0.3,
    metalness: 0.8,
    opacity: 0.85,
  },
  ship: {
    roughness: 0.4,
    metalness: 0.7,
    opacity: 1.0,
  },
  glass: {
    roughness: 0.05,
    metalness: 0.9,
    opacity: 0.3,
  },
  metal: {
    roughness: 0.25,
    metalness: 0.95,
    opacity: 1.0,
  },
  holographic: {
    roughness: 0.0,
    metalness: 1.0,
    opacity: 0.6,
  },
} as const;

export type SceneColorKey = keyof typeof COLORS;
export type GlowLevel = keyof Omit<typeof GLOW, "bloom">;
export type TimingKey = keyof typeof TIMING;
export type MaterialPreset = keyof typeof MATERIALS;
