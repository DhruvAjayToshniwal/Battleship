type QualityLevel = 'low' | 'medium' | 'high'

interface QualitySettings {
  oceanSegments: number
  shadowMapSize: number
  particleMultiplier: number
  enableBloom: boolean
  enableVignette: boolean
  waveOctaves: number
  maxTrailParticles: number
  maxExplosionParticles: number
}

const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  low: {
    oceanSegments: 48,
    shadowMapSize: 512,
    particleMultiplier: 0.5,
    enableBloom: false,
    enableVignette: false,
    waveOctaves: 3,
    maxTrailParticles: 6,
    maxExplosionParticles: 12,
  },
  medium: {
    oceanSegments: 80,
    shadowMapSize: 1024,
    particleMultiplier: 0.75,
    enableBloom: false,
    enableVignette: true,
    waveOctaves: 4,
    maxTrailParticles: 10,
    maxExplosionParticles: 20,
  },
  high: {
    oceanSegments: 80,
    shadowMapSize: 1024,
    particleMultiplier: 1.0,
    enableBloom: true,
    enableVignette: true,
    waveOctaves: 5,
    maxTrailParticles: 12,
    maxExplosionParticles: 24,
  },
}

function detectQualityLevel(): QualityLevel {
  if (typeof window === 'undefined') return 'medium'

  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  if (!gl) return 'low'

  const renderer = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
  if (renderer) {
    const gpu = (gl as WebGLRenderingContext).getParameter(renderer.UNMASKED_RENDERER_WEBGL)
    const lowEndKeywords = ['intel', 'mesa', 'swiftshader', 'llvmpipe']
    if (lowEndKeywords.some((k) => gpu.toLowerCase().includes(k))) {
      return 'low'
    }
  }

  const dpr = window.devicePixelRatio || 1
  const screenPixels = window.screen.width * window.screen.height * dpr * dpr
  if (screenPixels > 8000000) return 'high'
  if (screenPixels > 3000000) return 'medium'
  return 'low'
}

function getQualitySettings(level?: QualityLevel): QualitySettings {
  const resolved = level ?? detectQualityLevel()
  return QUALITY_PRESETS[resolved]
}

export { getQualitySettings, detectQualityLevel, QUALITY_PRESETS }
export type { QualityLevel, QualitySettings }
