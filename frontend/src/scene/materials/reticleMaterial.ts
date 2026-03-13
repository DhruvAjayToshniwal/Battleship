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
uniform float uActive;

varying vec2 vUv;

void main() {
  vec2 center = vUv - 0.5;
  float dist = length(center);
  float angle = atan(center.y, center.x);

  float rotation = uTime * 1.5;
  float rotatedAngle = angle + rotation;

  float pulse = 0.7 + 0.3 * sin(uTime * 3.0);

  float crosshair = 0.0;
  for (int i = 0; i < 4; i++) {
    float target = float(i) * 1.5707963 + rotation;
    float angleDiff = abs(mod(angle - target + 3.14159, 6.28318) - 3.14159);
    float line = smoothstep(0.04, 0.01, angleDiff);
    line *= smoothstep(0.05, 0.1, dist) * smoothstep(0.5, 0.35, dist);
    crosshair += line;
  }

  float ring1 = smoothstep(0.02, 0.0, abs(dist - 0.3));
  float ring2 = smoothstep(0.015, 0.0, abs(dist - 0.45));

  float centerDot = smoothstep(0.04, 0.02, dist);

  float alpha = (crosshair + ring1 + ring2 + centerDot) * pulse * uActive;
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(uColor * pulse, alpha);
}
`;

export function createReticleMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0.0 },
      uColor: { value: new THREE.Vector3(0.94, 0.27, 0.27) },
      uActive: { value: 1.0 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
