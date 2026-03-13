export type AspectCategory = "ultrawide" | "wide" | "standard" | "narrow" | "mobile";

export function getAspectCategory(width: number, height: number): AspectCategory {
  const ratio = width / height;
  if (ratio >= 2.2) return "ultrawide";
  if (ratio >= 1.6) return "wide";
  if (ratio >= 1.2) return "standard";
  if (ratio >= 0.8) return "narrow";
  return "mobile";
}

const FOV_MAP: Record<AspectCategory, number> = {
  ultrawide: 40,
  wide: 45,
  standard: 50,
  narrow: 58,
  mobile: 65,
};

const DISTANCE_SCALE_MAP: Record<AspectCategory, number> = {
  ultrawide: 0.8,
  wide: 0.9,
  standard: 1.0,
  narrow: 1.2,
  mobile: 1.45,
};

export function getResponsiveFOV(width: number, height: number): number {
  const category = getAspectCategory(width, height);
  return FOV_MAP[category];
}

export function getResponsiveCameraDistance(
  width: number,
  height: number,
  baseDistance: number
): number {
  const category = getAspectCategory(width, height);
  return baseDistance * DISTANCE_SCALE_MAP[category];
}

export function getResponsiveScale(width: number, height: number, baseScale: number): number {
  const category = getAspectCategory(width, height);
  const scaleMap: Record<AspectCategory, number> = {
    ultrawide: 1.1,
    wide: 1.0,
    standard: 0.95,
    narrow: 0.85,
    mobile: 0.7,
  };
  return baseScale * scaleMap[category];
}
