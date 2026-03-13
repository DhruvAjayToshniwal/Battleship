import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uActive;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.5);
    vec2 uv = vUv - center;
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);

    float sweepAngle = mod(uTime * 1.5, 6.2831853);
    float angleDiff = mod(angle - sweepAngle + 6.2831853, 6.2831853);
    float sweep = smoothstep(1.0, 0.0, angleDiff) * 0.35;

    float sweepGlow = smoothstep(0.3, 0.0, angleDiff) * 0.15;
    sweep += sweepGlow;

    float ring1 = abs(dist - 0.12);
    float ring2 = abs(dist - 0.24);
    float ring3 = abs(dist - 0.36);
    float ring4 = abs(dist - 0.48);
    float rings = smoothstep(0.006, 0.001, ring1) * 0.12
                + smoothstep(0.006, 0.001, ring2) * 0.10
                + smoothstep(0.006, 0.001, ring3) * 0.08
                + smoothstep(0.008, 0.002, ring4) * 0.20;

    float crossH = smoothstep(0.003, 0.0005, abs(uv.y)) * step(dist, 0.49) * 0.06;
    float crossV = smoothstep(0.003, 0.0005, abs(uv.x)) * step(dist, 0.49) * 0.06;

    float border = smoothstep(0.012, 0.004, abs(dist - 0.49)) * 0.3;

    float pulse = 0.5 + 0.5 * sin(uTime * 2.5);
    float centerDot = smoothstep(0.015, 0.005, dist) * 0.5 * (0.6 + 0.4 * pulse);

    float scanPulse = smoothstep(0.02, 0.0, abs(dist - mod(uTime * 0.3, 0.5))) * 0.08;

    float alpha = (sweep + rings + crossH + crossV + border + centerDot + scanPulse) * uActive;
    alpha *= smoothstep(0.5, 0.48, dist);

    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function createRadarMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 1.0 },
      uColor: { value: new THREE.Color(0.22, 0.74, 0.97) },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
