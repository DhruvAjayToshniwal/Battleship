import * as THREE from "three";

const VERTEX = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT = `
uniform float uTime;
uniform float uActive;
uniform vec3 uColor;

varying vec2 vUv;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

float ring(float dist, float radius, float thickness) {
  return smoothstep(thickness, thickness * 0.2, abs(dist - radius));
}

void main() {
  vec2 uv = vUv - 0.5;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);

  float boundaryMask = smoothstep(0.5, 0.48, dist);

  float sweepSpeed = TAU / 3.0;
  float sweepAngle = mod(uTime * sweepSpeed, TAU);
  float angleDiff = mod(angle - sweepAngle + TAU, TAU);

  float sweepBeam = smoothstep(0.6, 0.0, angleDiff) * smoothstep(0.0, 0.02, angleDiff);
  float sweepBright = smoothstep(0.15, 0.0, angleDiff) * 0.8;
  float sweepTrail = sweepBeam * 0.3 + sweepBright;
  sweepTrail *= smoothstep(0.02, 0.06, dist) * smoothstep(0.48, 0.44, dist);

  float ring1 = ring(dist, 0.10, 0.005) * 0.15;
  float ring2 = ring(dist, 0.20, 0.005) * 0.12;
  float ring3 = ring(dist, 0.32, 0.005) * 0.10;
  float ring4 = ring(dist, 0.44, 0.005) * 0.08;
  float rings = ring1 + ring2 + ring3 + ring4;

  float crossThickness = 0.0015;
  float crossH = smoothstep(crossThickness, crossThickness * 0.3, abs(uv.y)) * step(dist, 0.47) * 0.08;
  float crossV = smoothstep(crossThickness, crossThickness * 0.3, abs(uv.x)) * step(dist, 0.47) * 0.08;
  float crosshair = crossH + crossV;

  float borderInner = ring(dist, 0.48, 0.008) * 0.45;
  float borderGlow = ring(dist, 0.48, 0.025) * 0.15;
  float border = borderInner + borderGlow;

  float pulse = 0.5 + 0.5 * sin(uTime * 2.5);
  float centerDot = smoothstep(0.018, 0.006, dist) * 0.6 * (0.5 + 0.5 * pulse);
  float centerGlow = smoothstep(0.05, 0.01, dist) * 0.15;

  float scanRadius = mod(uTime * 0.25, 0.5);
  float scanPulse = ring(dist, scanRadius, 0.012) * 0.12;
  float scanGlow = ring(dist, scanRadius, 0.04) * 0.05;
  float scan = scanPulse + scanGlow;

  float sonarPulse1 = ring(dist, mod(uTime * 0.15, 0.5), 0.008) * 0.06;
  float sonarPulse2 = ring(dist, mod(uTime * 0.15 + 0.25, 0.5), 0.008) * 0.04;
  float sonar = sonarPulse1 + sonarPulse2;

  float tickMarks = 0.0;
  for (int i = 0; i < 36; i++) {
    float tickAngle = float(i) * TAU / 36.0;
    float tickDiff = abs(mod(angle - tickAngle + PI, TAU) - PI);
    float isMajor = step(0.5, mod(float(i), 9.0) < 0.5 ? 1.0 : 0.0);
    float tickLen = mix(0.015, 0.025, isMajor);
    float tickWidth = mix(0.008, 0.012, isMajor);
    float tick = smoothstep(tickWidth, tickWidth * 0.3, tickDiff);
    tick *= smoothstep(0.0, 0.001, dist - (0.46 - tickLen)) * smoothstep(0.47, 0.46, dist);
    tickMarks += tick * 0.06;
  }

  float alpha = sweepTrail + rings + crosshair + border + centerDot + centerGlow + scan + sonar + tickMarks;
  alpha *= boundaryMask * uActive;
  alpha = clamp(alpha, 0.0, 1.0);

  vec3 color = uColor;
  vec3 brightColor = uColor * 1.8 + vec3(0.2);
  vec3 finalColor = mix(color, brightColor, sweepBright + centerDot * 0.5);

  gl_FragColor = vec4(finalColor, alpha);
}
`;

export function createRadarMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime: { value: 0.0 },
      uActive: { value: 1.0 },
      uColor: { value: new THREE.Color(0.22, 0.74, 0.97) },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
