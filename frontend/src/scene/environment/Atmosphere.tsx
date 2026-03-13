import { useMemo } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec3 vPosition;

void main() {
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec3 vPosition;

void main() {
  float heightFactor = normalize(vPosition).y;
  float density = mix(0.06, 0.01, clamp(heightFactor, 0.0, 1.0));
  vec3 hazeColor = vec3(0.05, 0.1, 0.18);
  gl_FragColor = vec4(hazeColor, density);
}
`;

export default function Atmosphere() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  return (
    <mesh material={material}>
      <sphereGeometry args={[50, 32, 32]} />
    </mesh>
  );
}
