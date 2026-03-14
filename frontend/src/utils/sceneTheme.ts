import * as THREE from 'three'

const COLORS = {
  ocean: {
    deep: new THREE.Color('#080808'),
    surface: new THREE.Color('#0d1a2a'),
    foam: new THREE.Color('#8a9aaa'),
    subsurface: new THREE.Color('#04253d'),
  },
  sky: {
    zenith: new THREE.Color('#050505'),
    horizon: new THREE.Color('#0a1020'),
    stars: new THREE.Color('#a0a8b8'),
    moon: new THREE.Color('#d0d8e0'),
  },
  board: {
    playerBase: new THREE.Color('#0a1a2e'),
    playerTrim: new THREE.Color('#4a9ead'),
    playerEmissive: new THREE.Color('#1a3040'),
    enemyBase: new THREE.Color('#1a0a0a'),
    enemyTrim: new THREE.Color('#8b3a3a'),
    enemyEmissive: new THREE.Color('#301010'),
    gridLine: new THREE.Color('#1a2a3a'),
  },
  effects: {
    hit: new THREE.Color('#aa4400'),
    miss: new THREE.Color('#4a8090'),
    sunk: new THREE.Color('#882222'),
    missile: new THREE.Color('#aa7700'),
    explosion: new THREE.Color('#884400'),
    splash: new THREE.Color('#4a8899'),
    radar: new THREE.Color('#4a9ead'),
    reticle: new THREE.Color('#8b3a3a'),
  },
  lighting: {
    key: new THREE.Color('#8a9aaa'),
    fill: new THREE.Color('#aa9888'),
    rim: new THREE.Color('#4a6a7a'),
    ambient: new THREE.Color('#0a1520'),
  },
  hud: {
    primary: '#4a9ead',
    danger: '#8b3a3a',
    success: '#6a8a6a',
    warning: '#8a7a4a',
    text: '#e8e8e8',
    background: 'rgba(10, 10, 10, 0.85)',
  },
} as const

const INTENSITIES = {
  keyLight: 1.0,
  fillLight: 0.1,
  rimLight: 0.15,
  ambientLight: 0.25,
  bloom: 0.3,
  boardEmissive: 0.2,
  trimEmissive: 0.4,
  hitFlash: 5,
  explosionLight: 10,
  radarGlow: 1,
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
  cameraTransition: 3.0,
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
