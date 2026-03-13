export type QualityLevel = "low" | "medium" | "high" | "cinematic";

export interface QualitySettings {
  oceanSegments: number;
  shadowMapSize: number;
  particleMultiplier: number;
  enablePostProcessing: boolean;
  enableWakes: boolean;
  enableAtmosphere: boolean;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  low: {
    oceanSegments: 64,
    shadowMapSize: 512,
    particleMultiplier: 0.5,
    enablePostProcessing: false,
    enableWakes: false,
    enableAtmosphere: false,
  },
  medium: {
    oceanSegments: 128,
    shadowMapSize: 1024,
    particleMultiplier: 1.0,
    enablePostProcessing: false,
    enableWakes: true,
    enableAtmosphere: true,
  },
  high: {
    oceanSegments: 192,
    shadowMapSize: 2048,
    particleMultiplier: 1.5,
    enablePostProcessing: true,
    enableWakes: true,
    enableAtmosphere: true,
  },
  cinematic: {
    oceanSegments: 256,
    shadowMapSize: 4096,
    particleMultiplier: 2.0,
    enablePostProcessing: true,
    enableWakes: true,
    enableAtmosphere: true,
  },
};

export function getQualitySettings(level: QualityLevel = "high"): QualitySettings {
  return QUALITY_PRESETS[level];
}
