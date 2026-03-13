import { useMemo } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec3 skyTop = vec3(0.008, 0.03, 0.06);
  vec3 skyHorizon = vec3(0.04, 0.12, 0.24);

  float heightFactor = normalize(vPosition).y;
  float gradientT = clamp(heightFactor, 0.0, 1.0);

  vec3 color = mix(skyHorizon, skyTop, gradientT);

  float horizonGlow = exp(-abs(heightFactor) * 8.0);
  vec3 warmTint = vec3(0.15, 0.08, 0.02);
  color += warmTint * horizonGlow * 0.4;

  if (heightFactor > 0.6) {
    float starField = random(floor(vUv * 800.0));
    float starThreshold = 0.998;
    if (starField > starThreshold) {
      float brightness = (starField - starThreshold) / (1.0 - starThreshold);
      color += vec3(brightness * 0.8);
    }
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

export default function SkyBackdrop() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );

  return (
    <mesh material={material}>
      <sphereGeometry args={[80, 64, 64]} />
    </mesh>
  );
}
