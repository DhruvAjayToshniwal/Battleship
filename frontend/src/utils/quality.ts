export type QualityLevel = "low" | "medium" | "high" | "cinematic";

export interface QualitySettings {
  oceanSegments: number;
  particleCount: number;
  shadowMapSize: number;
  shadowCascades: number;
  bloomEnabled: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  ssaoEnabled: boolean;
  reflectionsEnabled: boolean;
  foamEnabled: boolean;
  wakeEnabled: boolean;
  atmosphereEnabled: boolean;
  antialias: boolean;
  pixelRatio: number;
  maxLights: number;
}

const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  low: {
    oceanSegments: 64,
    particleCount: 200,
    shadowMapSize: 512,
    shadowCascades: 1,
    bloomEnabled: false,
    bloomStrength: 0.0,
    bloomRadius: 0.0,
    bloomThreshold: 1.0,
    ssaoEnabled: false,
    reflectionsEnabled: false,
    foamEnabled: false,
    wakeEnabled: false,
    atmosphereEnabled: false,
    antialias: false,
    pixelRatio: 1.0,
    maxLights: 4,
  },
  medium: {
    oceanSegments: 128,
    particleCount: 500,
    shadowMapSize: 1024,
    shadowCascades: 2,
    bloomEnabled: true,
    bloomStrength: 0.5,
    bloomRadius: 0.3,
    bloomThreshold: 0.7,
    ssaoEnabled: false,
    reflectionsEnabled: false,
    foamEnabled: true,
    wakeEnabled: true,
    atmosphereEnabled: true,
    antialias: true,
    pixelRatio: 1.0,
    maxLights: 8,
  },
  high: {
    oceanSegments: 192,
    particleCount: 1000,
    shadowMapSize: 2048,
    shadowCascades: 3,
    bloomEnabled: true,
    bloomStrength: 0.8,
    bloomRadius: 0.4,
    bloomThreshold: 0.6,
    ssaoEnabled: true,
    reflectionsEnabled: true,
    foamEnabled: true,
    wakeEnabled: true,
    atmosphereEnabled: true,
    antialias: true,
    pixelRatio: Math.min(window.devicePixelRatio, 2.0),
    maxLights: 16,
  },
  cinematic: {
    oceanSegments: 256,
    particleCount: 2000,
    shadowMapSize: 4096,
    shadowCascades: 4,
    bloomEnabled: true,
    bloomStrength: 1.0,
    bloomRadius: 0.5,
    bloomThreshold: 0.5,
    ssaoEnabled: true,
    reflectionsEnabled: true,
    foamEnabled: true,
    wakeEnabled: true,
    atmosphereEnabled: true,
    antialias: true,
    pixelRatio: Math.min(window.devicePixelRatio, 2.5),
    maxLights: 32,
  },
};

let cachedLevel: QualityLevel | null = null;
let cachedSettings: QualitySettings | null = null;

export function getQualityPreset(level: QualityLevel = "high"): QualitySettings {
  if (cachedLevel === level && cachedSettings !== null) {
    return cachedSettings;
  }
  cachedSettings = { ...QUALITY_PRESETS[level] };
  cachedLevel = level;
  return cachedSettings;
}

export function detectQualityLevel(): QualityLevel {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      return "low";
    }
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase()
      : "";
    const isMobile = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
    if (isMobile) {
      return "low";
    }
    if (/nvidia|radeon rx [5-9]|geforce (rtx|gtx 1[6-9]|gtx 20)/i.test(renderer)) {
      return "cinematic";
    }
    if (/radeon|geforce|intel (iris|arc)/i.test(renderer)) {
      return "high";
    }
    return "medium";
  } catch {
    return "medium";
  }
}

export { QUALITY_PRESETS };
