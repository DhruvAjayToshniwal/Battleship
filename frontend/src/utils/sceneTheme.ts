import * as THREE from 'three'

const COLORS = {
  ocean: {
    deep: new THREE.Color('#0a1628'),
    surface: new THREE.Color('#0d2847'),
    foam: new THREE.Color('#b8d4e8'),
    subsurface: new THREE.Color('#064273'),
  },
  sky: {
    zenith: new THREE.Color('#020810'),
    horizon: new THREE.Color('#0a1e3d'),
    stars: new THREE.Color('#c8d8ff'),
    moon: new THREE.Color('#e8f0ff'),
  },
  board: {
    playerBase: new THREE.Color('#0a1a2e'),
    playerTrim: new THREE.Color('#00e5ff'),
    playerEmissive: new THREE.Color('#003850'),
    enemyBase: new THREE.Color('#1a0a0a'),
    enemyTrim: new THREE.Color('#ff3d3d'),
    enemyEmissive: new THREE.Color('#500000'),
    gridLine: new THREE.Color('#1a3a5a'),
  },
  effects: {
    hit: new THREE.Color('#ff4400'),
    miss: new THREE.Color('#00ccff'),
    sunk: new THREE.Color('#ff0000'),
    missile: new THREE.Color('#ffaa00'),
    explosion: new THREE.Color('#ff6600'),
    splash: new THREE.Color('#44ccff'),
    radar: new THREE.Color('#00ff88'),
    reticle: new THREE.Color('#ff2222'),
  },
  lighting: {
    key: new THREE.Color('#b4c6e7'),
    fill: new THREE.Color('#ffd4a3'),
    rim: new THREE.Color('#38bdf8'),
    ambient: new THREE.Color('#1a2a4a'),
  },
  hud: {
    primary: '#00e5ff',
    danger: '#ff3d3d',
    success: '#00ff88',
    warning: '#ffaa00',
    text: '#e0f0ff',
    background: 'rgba(10, 14, 26, 0.85)',
  },
} as const

const INTENSITIES = {
  keyLight: 1.5,
  fillLight: 0.15,
  rimLight: 0.3,
  ambientLight: 0.4,
  bloom: 0.6,
  boardEmissive: 0.4,
  trimEmissive: 0.8,
  hitFlash: 8,
  explosionLight: 15,
  radarGlow: 2,
} as const

const DURATIONS = {
  missile: 1.2,
  explosion: 0.8,
  splash: 1.0,
  hitFlash: 0.15,
  shockwave: 0.6,
  smoke: 2.0,
  turnBanner: 1.2,
  introOverlay: 1.2,
  cameraTransition: 1.5,
  victoryOrbit: 8.0,
} as const

const SIZES = {
  boardUnit: 1.0,
  boardGap: 0.05,
  boardThickness: 0.08,
  frameWidth: 0.15,
  frameDepth: 0.12,
  shipHeight: 0.18,
  cellSize: 1.0,
  oceanSize: 80,
  skyRadius: 90,
  atmosphereRadius: 85,
} as const

export { COLORS, INTENSITIES, DURATIONS, SIZES }
