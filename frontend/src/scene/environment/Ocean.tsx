import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OceanProps {
  position?: [number, number, number];
  size?: [number, number];
}

const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float wave1 = sin(pos.x * 0.8 + uTime * 0.7) * 0.05;
    float wave2 = cos(pos.y * 1.1 + uTime * 0.5) * 0.04;
    float wave3 = sin((pos.x + pos.y) * 0.5 + uTime * 0.9) * 0.03;
    float wave4 = sin(pos.x * 2.0 + uTime * 1.5) * 0.015;
    float wave5 = cos(pos.y * 1.8 + uTime * 1.2) * 0.012;

    float elevation = wave1 + wave2 + wave3 + wave4 + wave5;
    pos.z += elevation;
    vElevation = elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vec3 deepColor = vec3(0.02, 0.04, 0.10);
    vec3 surfaceColor = vec3(0.04, 0.08, 0.18);
    vec3 foamColor = vec3(0.15, 0.25, 0.40);

    float mixFactor = (vElevation + 0.1) * 4.0;
    mixFactor = clamp(mixFactor, 0.0, 1.0);

    vec3 color = mix(deepColor, surfaceColor, mixFactor);

    float foam = smoothstep(0.06, 0.09, vElevation);
    color = mix(color, foamColor, foam * 0.3);

    float shimmer = sin(vUv.x * 40.0 + uTime * 2.0) * sin(vUv.y * 40.0 + uTime * 1.5);
    color += vec3(0.01, 0.02, 0.04) * shimmer * 0.5;

    gl_FragColor = vec4(color, 0.85);
  }
`;

export default function Ocean({ position = [0, 0, 0], size = [14, 14] }: OceanProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size[0], size[1], 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
