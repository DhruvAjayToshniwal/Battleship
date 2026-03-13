import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;

varying vec2 vUv;

void main() {
  float distX = min(vUv.x, 1.0 - vUv.x);
  float distY = min(vUv.y, 1.0 - vUv.y);
  float edgeDist = min(distX, distY);

  float glow = 1.0 - smoothstep(0.0, 0.15, edgeDist);
  float pulse = 0.7 + 0.3 * sin(uTime * 2.0);

  float alpha = glow * pulse * uIntensity;

  gl_FragColor = vec4(uColor * uIntensity * pulse, alpha);
}
`;

export function createBoardGlowMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0.0 },
      uColor: { value: new THREE.Vector3(0.22, 0.74, 0.97) },
      uIntensity: { value: 1.0 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
