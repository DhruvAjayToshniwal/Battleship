import * as THREE from "three";

const VERTEX = `
uniform float uTime;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vFoamMask;

vec3 gerstnerWave(vec2 pos, float amplitude, float frequency, float steepness, vec2 direction, float speed, float phase) {
  vec2 d = normalize(direction);
  float f = dot(d, pos) * frequency + uTime * speed + phase;
  float s = sin(f);
  float c = cos(f);
  float q = steepness / (frequency * amplitude * 5.0);
  return vec3(
    q * amplitude * d.x * c,
    amplitude * s,
    q * amplitude * d.y * c
  );
}

void main() {
  vUv = uv;
  vec3 pos = position;

  vec3 w1 = gerstnerWave(pos.xz, 0.20, 0.7, 0.5, vec2(1.0, 0.4), 0.4, 0.0);
  vec3 w2 = gerstnerWave(pos.xz, 0.12, 1.2, 0.4, vec2(-0.6, 1.0), 0.6, 1.3);
  vec3 w3 = gerstnerWave(pos.xz, 0.06, 2.0, 0.3, vec2(0.8, -0.5), 1.0, 2.7);
  vec3 w4 = gerstnerWave(pos.xz, 0.025, 3.5, 0.25, vec2(-0.3, -0.9), 1.4, 4.1);

  vec3 totalDisplacement = w1 + w2 + w3 + w4;
  pos.x += totalDisplacement.x;
  pos.y += totalDisplacement.y;
  pos.z += totalDisplacement.z;

  vElevation = totalDisplacement.y;

  float eps = 0.1;

  vec3 dxW1 = gerstnerWave(vec2(position.x + eps, position.z), 0.20, 0.7, 0.5, vec2(1.0, 0.4), 0.4, 0.0);
  vec3 dxW2 = gerstnerWave(vec2(position.x + eps, position.z), 0.12, 1.2, 0.4, vec2(-0.6, 1.0), 0.6, 1.3);
  vec3 dxW3 = gerstnerWave(vec2(position.x + eps, position.z), 0.06, 2.0, 0.3, vec2(0.8, -0.5), 1.0, 2.7);
  float dxHeight = (dxW1 + dxW2 + dxW3).y;

  vec3 dzW1 = gerstnerWave(vec2(position.x, position.z + eps), 0.20, 0.7, 0.5, vec2(1.0, 0.4), 0.4, 0.0);
  vec3 dzW2 = gerstnerWave(vec2(position.x, position.z + eps), 0.12, 1.2, 0.4, vec2(-0.6, 1.0), 0.6, 1.3);
  vec3 dzW3 = gerstnerWave(vec2(position.x, position.z + eps), 0.06, 2.0, 0.3, vec2(0.8, -0.5), 1.0, 2.7);
  float dzHeight = (dzW1 + dzW2 + dzW3).y;

  vec3 tangentX = normalize(vec3(eps, dxHeight - totalDisplacement.y, 0.0));
  vec3 tangentZ = normalize(vec3(0.0, dzHeight - totalDisplacement.y, eps));
  vNormal = normalize(cross(tangentZ, tangentX));

  float heightDerivative = length(vec2(dxHeight - totalDisplacement.y, dzHeight - totalDisplacement.y)) / eps;
  vFoamMask = smoothstep(0.25, 0.9, heightDerivative) + smoothstep(0.10, 0.22, vElevation) * 0.6;
  vFoamMask = clamp(vFoamMask, 0.0, 1.0);

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const FRAGMENT = `
uniform float uTime;
uniform vec3 uSunDirection;
uniform vec3 uWaterColor;
uniform vec3 uDeepColor;
uniform vec3 uFoamColor;
uniform float uOpacity;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vFoamMask;

float schlickFresnel(float cosTheta) {
  float f0 = 0.02;
  return f0 + (1.0 - f0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

float subsurfaceScattering(vec3 viewDir, vec3 lightDir, vec3 normal) {
  vec3 backLight = normalize(lightDir + normal * 0.6);
  float sss = pow(clamp(dot(viewDir, -backLight), 0.0, 1.0), 3.0);
  return sss * 0.4;
}

vec3 pseudoEnvironment(vec3 reflectDir) {
  float skyBlend = smoothstep(-0.1, 0.5, reflectDir.y);
  vec3 skyColor = mix(vec3(0.05, 0.10, 0.20), vec3(0.01, 0.02, 0.06), skyBlend);
  // Moon reflection — direction matches LightingRig moonlight
  float moonGlow = pow(max(dot(reflectDir, normalize(vec3(0.4, 0.8, -0.5))), 0.0), 48.0);
  skyColor += vec3(0.6, 0.65, 0.7) * moonGlow;
  float horizonGlow = pow(1.0 - abs(reflectDir.y), 5.0);
  skyColor += vec3(0.06, 0.10, 0.16) * horizonGlow;
  return skyColor;
}

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uSunDirection);

  float depthFactor = smoothstep(-0.18, 0.14, vElevation);
  vec3 baseColor = mix(uDeepColor, uWaterColor, depthFactor);

  float cosTheta = max(dot(normal, viewDir), 0.0);
  float fresnel = schlickFresnel(cosTheta);

  // View-angle-dependent brightening — lifts overhead camera from pitch-black
  float overheadBoost = pow(cosTheta, 1.8);
  baseColor += uWaterColor * overheadBoost * 0.22;

  vec3 reflectDir = reflect(-viewDir, normal);
  vec3 envColor = pseudoEnvironment(reflectDir);
  baseColor = mix(baseColor, envColor, fresnel * 0.75);

  // Specular — moonpath (broad + sharp)
  vec3 halfDir = normalize(lightDir + viewDir);
  float specNdotH = max(dot(normal, halfDir), 0.0);
  float specSharp = pow(specNdotH, 256.0) * 3.0;
  float specBroad = pow(specNdotH, 24.0) * 0.7;
  vec3 specColor = vec3(0.80, 0.87, 0.95);
  baseColor += specColor * (specSharp + specBroad);

  // Subsurface scattering
  float sss = subsurfaceScattering(viewDir, lightDir, normal);
  baseColor += vec3(0.06, 0.22, 0.28) * sss;

  // Foam — clearly visible
  baseColor = mix(baseColor, uFoamColor, vFoamMask * 0.70);

  // Shimmer / sparkle
  float shimmerA = sin(vWorldPosition.x * 12.0 + uTime * 1.8) * cos(vWorldPosition.z * 10.0 + uTime * 1.3);
  float shimmerB = sin(vWorldPosition.x * 7.0 - uTime * 0.9) * cos(vWorldPosition.z * 5.0 + uTime * 0.7);
  float shimmer = (shimmerA + shimmerB) * 0.5;
  baseColor += vec3(0.10, 0.14, 0.18) * shimmer * 0.07 * fresnel;

  // Rim edge glow
  float edgeGlow = pow(1.0 - cosTheta, 3.5);
  baseColor += vec3(0.14, 0.35, 0.46) * edgeGlow * 0.20;

  // Distance fade — hide geometry edges (tuned so board-local patches stay opaque)
  float dist = length(vWorldPosition.xz);
  float distanceFade = 1.0 - smoothstep(35.0, 52.0, dist);

  gl_FragColor = vec4(baseColor, uOpacity * distanceFade);
}
`;

export function createOceanMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime: { value: 0.0 },
      // Direction matches LightingRig moonlight and SkyBackdrop moon direction
      uSunDirection: { value: new THREE.Vector3(0.4, 0.8, -0.5).normalize() },
      uWaterColor: { value: new THREE.Color(0.045, 0.15, 0.24) },
      uDeepColor: { value: new THREE.Color(0.010, 0.035, 0.07) },
      uFoamColor: { value: new THREE.Color(0.58, 0.68, 0.72) },
      uOpacity: { value: 0.95 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
