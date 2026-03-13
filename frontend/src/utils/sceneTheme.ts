export const COLORS = {
  deepOcean: "#020a14",
  surfaceBlue: "#0a1e3d",
  neonCyan: "#38bdf8",
  dangerRed: "#ef4444",
  hitOrange: "#ff6600",
  missBlue: "#7dd3fc",
  gridLine: "#1e3a5f",
  gridGlow: "#334155",
  shipHull: "#3b4a5c",
  shipDeck: "#4a5568",
  fogColor: "#0a0e1a",
  skyTop: "#020810",
  skyHorizon: "#0a1e3d",
  moonlight: "#b4c6d4",
  amber: "#fbbf24",
} as const;

export const GLOW = {
  radar: 0.5,
  hit: 1.5,
  missile: 3,
  explosion: 10,
  ambient: 0.3,
} as const;

export const TIMING = {
  missileFlight: 0.6,
  explosionDuration: 1.2,
  splashDuration: 1.0,
  turnDelay: 0.8,
  fireDelay: 1.2,
  cameraLerp: 1.8,
  introLength: 3.0,
} as const;
