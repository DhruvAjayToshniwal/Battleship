import * as THREE from "three";

const vertexShader = `
uniform float uTime;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec3 vWorldPosition;

float wave(vec2 pos, float freq, float amp, vec2 dir, float speed, float phase) {
  return amp * sin(dot(normalize(dir), pos) * freq + uTime * speed + phase);
}

void main() {
  vUv = uv;

  vec3 pos = position;

  float elevation = 0.0;
  elevation += wave(pos.xz, 1.2, 0.15, vec2(1.0, 0.3), 0.8, 0.0);
  elevation += wave(pos.xz, 2.5, 0.08, vec2(-0.5, 1.0), 1.2, 1.5);
  elevation += wave(pos.xz, 4.0, 0.04, vec2(0.7, -0.7), 1.8, 3.0);
  elevation += wave(pos.xz, 6.5, 0.02, vec2(-1.0, 0.2), 2.5, 0.7);
  elevation += wave(pos.xz, 10.0, 0.01, vec2(0.3, 1.0), 3.2, 2.1);

  elevation += 0.05 * sin(pos.x * 0.5 + uTime * 0.3) * cos(pos.z * 0.3 + uTime * 0.2);

  pos.y += elevation;
  vElevation = elevation;

  float delta = 0.01;
  float ex = 0.0;
  ex += wave(vec2(pos.x + delta, pos.z), 1.2, 0.15, vec2(1.0, 0.3), 0.8, 0.0);
  ex += wave(vec2(pos.x + delta, pos.z), 2.5, 0.08, vec2(-0.5, 1.0), 1.2, 1.5);
  ex += wave(vec2(pos.x + delta, pos.z), 4.0, 0.04, vec2(0.7, -0.7), 1.8, 3.0);

  float ez = 0.0;
  ez += wave(vec2(pos.x, pos.z + delta), 1.2, 0.15, vec2(1.0, 0.3), 0.8, 0.0);
  ez += wave(vec2(pos.x, pos.z + delta), 2.5, 0.08, vec2(-0.5, 1.0), 1.2, 1.5);
  ez += wave(vec2(pos.x, pos.z + delta), 4.0, 0.04, vec2(0.7, -0.7), 1.8, 3.0);

  vec3 tangentX = normalize(vec3(delta, ex - elevation, 0.0));
  vec3 tangentZ = normalize(vec3(0.0, ez - elevation, delta));
  vNormal = normalize(cross(tangentZ, tangentX));

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec3 uMoonDirection;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 deepColor = vec3(0.008, 0.04, 0.08);
  vec3 surfaceColor = vec3(0.04, 0.12, 0.24);
  vec3 foamColor = vec3(0.5, 0.7, 0.9);

  float blend = smoothstep(-0.1, 0.2, vElevation);
  vec3 baseColor = mix(deepColor, surfaceColor, blend);

  float foamMask = smoothstep(0.12, 0.2, vElevation);
  baseColor = mix(baseColor, foamColor, foamMask * 0.3);

  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
  vec3 edgeGlow = vec3(0.22, 0.74, 0.97);
  baseColor += edgeGlow * fresnel * 0.4;

  vec3 moonDir = normalize(uMoonDirection);
  vec3 halfDir = normalize(moonDir + viewDir);
  float spec = pow(max(dot(vNormal, halfDir), 0.0), 64.0);
  vec3 specColor = vec3(0.7, 0.78, 0.83);
  baseColor += specColor * spec * 1.2;

  float shimmer = sin(vWorldPosition.x * 8.0 + uTime * 2.0) * sin(vWorldPosition.z * 6.0 + uTime * 1.5);
  baseColor += vec3(0.1, 0.15, 0.2) * shimmer * 0.05;

  gl_FragColor = vec4(baseColor, 0.9);
}
`;

export function createOceanMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0.0 },
      uMoonDirection: { value: new THREE.Vector3(0.3, 1.0, 0.5) },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
