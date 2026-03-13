import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RadarSweepProps {
  position?: [number, number, number];
  size?: number;
  active?: boolean;
}

const sweepVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sweepFragmentShader = `
  uniform float uTime;
  uniform float uActive;
  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.5);
    vec2 uv = vUv - center;
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);

    float sweepAngle = mod(uTime * 1.5, 6.2831853);
    float angleDiff = mod(angle - sweepAngle + 6.2831853, 6.2831853);
    float sweep = smoothstep(0.8, 0.0, angleDiff) * 0.3;

    float ring1 = abs(dist - 0.15);
    float ring2 = abs(dist - 0.3);
    float ring3 = abs(dist - 0.45);
    float rings = smoothstep(0.008, 0.002, ring1) * 0.15
                + smoothstep(0.008, 0.002, ring2) * 0.1
                + smoothstep(0.008, 0.002, ring3) * 0.08;

    float crossH = smoothstep(0.004, 0.001, abs(uv.y)) * step(dist, 0.48) * 0.08;
    float crossV = smoothstep(0.004, 0.001, abs(uv.x)) * step(dist, 0.48) * 0.08;

    float border = smoothstep(0.01, 0.005, abs(dist - 0.48)) * 0.25;

    float pulse = 0.5 + 0.5 * sin(uTime * 2.0);
    float centerDot = smoothstep(0.02, 0.01, dist) * 0.4 * (0.7 + 0.3 * pulse);

    float alpha = (sweep + rings + crossH + crossV + border + centerDot) * uActive;
    alpha *= smoothstep(0.5, 0.48, dist);

    vec3 color = vec3(0.22, 0.74, 0.97);

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function RadarSweep({
  position = [0, 0, 0],
  size = 10,
  active = true,
}: RadarSweepProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActive: { value: active ? 1.0 : 0.0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uActive.value = active ? 1.0 : 0.0;
    }

    if (glowRef.current && active) {
      const t = clock.getElapsedTime();
      const angle = t * 1.5;
      const r = size * 0.2;
      glowRef.current.position.x = Math.sin(angle) * r;
      glowRef.current.position.z = Math.cos(angle) * r;
      glowRef.current.intensity = 0.5 + Math.sin(t * 3) * 0.2;
    }
  });

  if (!active) return null;

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[size, size]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={sweepVertexShader}
          fragmentShader={sweepFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <pointLight
        ref={glowRef}
        color="#38bdf8"
        intensity={0.5}
        distance={4}
        position={[0, 0.3, 0]}
      />
    </group>
  );
}
