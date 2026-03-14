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

  vec3 w1 = gerstnerWave(pos.xz, 0.22, 0.7, 0.6, vec2(1.0, 0.4), 0.6, 0.0);
  vec3 w2 = gerstnerWave(pos.xz, 0.14, 1.2, 0.5, vec2(-0.6, 1.0), 0.9, 1.3);
  vec3 w3 = gerstnerWave(pos.xz, 0.08, 2.0, 0.4, vec2(0.8, -0.5), 1.4, 2.7);
  vec3 w4 = gerstnerWave(pos.xz, 0.04, 3.5, 0.35, vec2(-0.3, -0.9), 2.0, 4.1);

  vec3 totalDisplacement = w1 + w2 + w3 + w4;
  pos.x += totalDisplacement.x;
  pos.y += totalDisplacement.y;
  pos.z += totalDisplacement.z;

  vElevation = totalDisplacement.y;

  float eps = 0.1;

  vec3 dxW1 = gerstnerWave(vec2(position.x + eps, position.z), 0.22, 0.7, 0.6, vec2(1.0, 0.4), 0.6, 0.0);
  vec3 dxW2 = gerstnerWave(vec2(position.x + eps, position.z), 0.14, 1.2, 0.5, vec2(-0.6, 1.0), 0.9, 1.3);
  vec3 dxW3 = gerstnerWave(vec2(position.x + eps, position.z), 0.08, 2.0, 0.4, vec2(0.8, -0.5), 1.4, 2.7);
  float dxHeight = (dxW1 + dxW2 + dxW3).y;

  vec3 dzW1 = gerstnerWave(vec2(position.x, position.z + eps), 0.22, 0.7, 0.6, vec2(1.0, 0.4), 0.6, 0.0);
  vec3 dzW2 = gerstnerWave(vec2(position.x, position.z + eps), 0.14, 1.2, 0.5, vec2(-0.6, 1.0), 0.9, 1.3);
  vec3 dzW3 = gerstnerWave(vec2(position.x, position.z + eps), 0.08, 2.0, 0.4, vec2(0.8, -0.5), 1.4, 2.7);
  float dzHeight = (dzW1 + dzW2 + dzW3).y;

  vec3 tangentX = normalize(vec3(eps, dxHeight - totalDisplacement.y, 0.0));
  vec3 tangentZ = normalize(vec3(0.0, dzHeight - totalDisplacement.y, eps));
  vNormal = normalize(cross(tangentZ, tangentX));

  float heightDerivative = length(vec2(dxHeight - totalDisplacement.y, dzHeight - totalDisplacement.y)) / eps;
  vFoamMask = smoothstep(0.4, 1.2, heightDerivative) + smoothstep(0.15, 0.25, vElevation) * 0.5;
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
  return sss * 0.35;
}

vec3 pseudoEnvironment(vec3 reflectDir) {
  float skyBlend = smoothstep(-0.1, 0.5, reflectDir.y);
  vec3 skyColor = mix(vec3(0.04, 0.08, 0.16), vec3(0.01, 0.02, 0.06), skyBlend);
  float moonGlow = pow(max(dot(reflectDir, normalize(vec3(0.3, 0.8, 0.5))), 0.0), 64.0);
  skyColor += vec3(0.6, 0.65, 0.7) * moonGlow;
  float horizonGlow = pow(1.0 - abs(reflectDir.y), 8.0);
  skyColor += vec3(0.03, 0.06, 0.1) * horizonGlow;
  return skyColor;
}

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uSunDirection);

  float depthFactor = smoothstep(-0.15, 0.1, vElevation);
  vec3 baseColor = mix(uDeepColor, uWaterColor, depthFactor);

  float cosTheta = max(dot(normal, viewDir), 0.0);
  float fresnel = schlickFresnel(cosTheta);

  vec3 reflectDir = reflect(-viewDir, normal);
  vec3 envColor = pseudoEnvironment(reflectDir);
  baseColor = mix(baseColor, envColor, fresnel * 0.7);

  vec3 halfDir = normalize(lightDir + viewDir);
  float specNdotH = max(dot(normal, halfDir), 0.0);
  float specular = pow(specNdotH, 256.0) * 2.5;
  float specularBroad = pow(specNdotH, 32.0) * 0.3;
  vec3 specColor = vec3(0.75, 0.82, 0.88);
  baseColor += specColor * (specular + specularBroad);

  float sss = subsurfaceScattering(viewDir, lightDir, normal);
  vec3 sssColor = vec3(0.05, 0.18, 0.22);
  baseColor += sssColor * sss;

  baseColor = mix(baseColor, uFoamColor, vFoamMask * 0.4);

  float shimmerA = sin(vWorldPosition.x * 12.0 + uTime * 1.8) * cos(vWorldPosition.z * 10.0 + uTime * 1.3);
  float shimmerB = sin(vWorldPosition.x * 7.0 - uTime * 0.9) * cos(vWorldPosition.z * 5.0 + uTime * 0.7);
  float shimmer = (shimmerA + shimmerB) * 0.5;
  baseColor += vec3(0.06, 0.1, 0.14) * shimmer * 0.04 * fresnel;

  float edgeGlow = pow(1.0 - cosTheta, 4.0);
  baseColor += vec3(0.1, 0.3, 0.4) * edgeGlow * 0.15;

  gl_FragColor = vec4(baseColor, uOpacity);
}
`;

export function createOceanMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime: { value: 0.0 },
      uSunDirection: { value: new THREE.Vector3(0.3, 1.0, 0.5) },
      uWaterColor: { value: new THREE.Color(0.05, 0.2, 0.32) },
      uDeepColor: { value: new THREE.Color(0.008, 0.03, 0.07) },
      uFoamColor: { value: new THREE.Color(0.7, 0.85, 0.9) },
      uOpacity: { value: 0.92 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
