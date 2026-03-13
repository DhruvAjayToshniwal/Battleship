export function getAspectCategory(width: number, height: number): "portrait" | "narrow" | "standard" | "wide" {
  const ratio = width / height;
  if (ratio < 0.8) return "portrait";
  if (ratio < 1.3) return "narrow";
  if (ratio < 1.8) return "standard";
  return "wide";
}

export function getResponsiveFOV(width: number, height: number): number {
  const category = getAspectCategory(width, height);
  switch (category) {
    case "portrait":
      return 60;
    case "narrow":
      return 55;
    case "standard":
      return 50;
    case "wide":
      return 45;
  }
}

export function getResponsiveCameraDistance(width: number, height: number, baseDistance: number): number {
  const category = getAspectCategory(width, height);
  switch (category) {
    case "portrait":
      return baseDistance * 1.4;
    case "narrow":
      return baseDistance * 1.2;
    case "standard":
      return baseDistance * 1.0;
    case "wide":
      return baseDistance * 0.9;
  }
}
