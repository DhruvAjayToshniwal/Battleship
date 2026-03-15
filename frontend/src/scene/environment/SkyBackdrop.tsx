import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float uTime;
varying vec3 vPosition;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float val = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    val += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return val;
}

void main() {
  vec3 dir = normalize(vPosition);
  float elevation = dir.y;

  vec3 topColor = vec3(0.01, 0.01, 0.03);
  vec3 midColor = vec3(0.02, 0.03, 0.08);
  vec3 horizonColor = vec3(0.04, 0.03, 0.06);
  vec3 bottomGlow = vec3(0.06, 0.04, 0.03);

  vec3 skyColor = mix(bottomGlow, horizonColor, smoothstep(-0.1, 0.0, elevation));
  skyColor = mix(skyColor, midColor, smoothstep(0.0, 0.3, elevation));
  skyColor = mix(skyColor, topColor, smoothstep(0.3, 0.8, elevation));

  float horizonLine = exp(-pow((elevation - 0.0) * 20.0, 2.0));
  skyColor += vec3(0.08, 0.05, 0.03) * horizonLine * 0.4;

  vec2 starUv = vec2(atan(dir.x, dir.z) * 15.0, elevation * 30.0);
  for (int layer = 0; layer < 3; layer++) {
    vec2 offset = vec2(float(layer) * 100.0, float(layer) * 73.0);
    vec2 gridId = floor(starUv * (8.0 + float(layer) * 4.0) + offset);
    float starRand = hash(gridId);
    if (starRand > 0.65 && elevation > 0.05) {
      vec2 gridUv = fract(starUv * (8.0 + float(layer) * 4.0) + offset) - 0.5;
      vec2 starPos = vec2(hash(gridId + 1.0) - 0.5, hash(gridId + 2.0) - 0.5) * 0.7;
      float dist = length(gridUv - starPos);
      float brightness = smoothstep(0.03, 0.0, dist);
      float baseBright = hash(gridId + 3.0) * 0.6 + 0.4;
      float twinkle = 1.0;
      if (hash(gridId + 4.0) > 0.6) {
        twinkle = 0.7 + 0.3 * sin(uTime * (1.0 + hash(gridId + 5.0) * 3.0) + hash(gridId + 6.0) * 6.28);
      }
      float elevFade = smoothstep(0.05, 0.2, elevation);
      skyColor += vec3(0.9, 0.92, 1.0) * brightness * baseBright * twinkle * elevFade;
    }
  }

  vec3 moonDir = normalize(vec3(0.4, 0.7, -0.5));
  float moonAngle = dot(dir, moonDir);
  float moonDisc = smoothstep(0.997, 0.999, moonAngle);
  float moonGlow = smoothstep(0.98, 0.999, moonAngle) * 0.15;
  skyColor += vec3(0.85, 0.9, 1.0) * moonDisc;
  skyColor += vec3(0.4, 0.5, 0.7) * moonGlow;

  vec2 nebulaUv = vec2(atan(dir.x, dir.z) * 2.0, elevation * 3.0);
  float nebula1 = fbm(nebulaUv + vec2(uTime * 0.005, 0.0));
  float nebula2 = fbm(nebulaUv * 1.5 + vec2(0.0, uTime * 0.003));
  float nebulaMask = smoothstep(0.2, 0.7, elevation) * smoothstep(0.8, 0.5, elevation);
  skyColor += vec3(0.1, 0.05, 0.2) * nebula1 * nebulaMask * 0.25;
  skyColor += vec3(0.05, 0.15, 0.1) * nebula2 * nebulaMask * 0.15;

  gl_FragColor = vec4(skyColor, 1.0);
}
`

export default function SkyBackdrop() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), [])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh>
      <sphereGeometry args={[90, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
