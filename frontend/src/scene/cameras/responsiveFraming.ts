interface Shot {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export function getResponsiveShot(
  shot: Shot,
  width: number,
  height: number
): Shot {
  const aspect = width / height;
  const adjusted: Shot = {
    position: [...shot.position],
    target: [...shot.target],
    fov: shot.fov,
  };

  if (aspect < 0.8) {
    adjusted.position[1] = shot.position[1] * 1.5;
    adjusted.position[2] = shot.position[2] * 1.4;
    adjusted.fov = shot.fov + 10;
  } else if (aspect < 1.3) {
    adjusted.position[1] = shot.position[1] * 1.3;
    adjusted.position[2] = shot.position[2] * 1.2;
    adjusted.fov = shot.fov + 5;
  }

  return adjusted;
}

