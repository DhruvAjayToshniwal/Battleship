import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GridPlaneProps {
  position?: [number, number, number];
  size?: number;
  color?: string;
}

/* Foam ring shader — glows at board edges where water meets the tactical surface */
const FOAM_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FOAM_FRAG = `
  uniform float uTime;
  uniform float uSize;
  varying vec2 vUv;

  void main() {
    vec2 centered = (vUv - 0.5) * 2.0; // -1 to 1
    float halfBoard = 1.0; // normalized board edge

    // Distance from board edge (square SDF)
    float dx = abs(centered.x) - halfBoard * (uSize / (uSize + 1.6));
    float dy = abs(centered.y) - halfBoard * (uSize / (uSize + 1.6));
    float edgeDist = max(dx, dy);

    // Foam ring: visible in a narrow band around the board edge
    float foam = smoothstep(0.0, 0.06, edgeDist) * smoothstep(0.14, 0.06, edgeDist);

    // Animated ripple
    float ripple = sin(edgeDist * 60.0 - uTime * 2.5) * 0.5 + 0.5;
    foam *= 0.5 + ripple * 0.5;

    // Only outside the board
    float outsideBoard = smoothstep(-0.01, 0.01, edgeDist);
    foam *= outsideBoard;

    vec3 foamColor = vec3(0.35, 0.55, 0.65);
    gl_FragColor = vec4(foamColor, foam * 0.25);
  }
`;

export default function GridPlane({
  position = [0, 0, 0],
  size = 10,
  color = '#1e3a5f',
}: GridPlaneProps) {
  const foamMatRef = useRef<THREE.ShaderMaterial>(null);

  const gridGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const half = size / 2;

    for (let i = 0; i <= size; i++) {
      const offset = -half + i;
      points.push(new THREE.Vector3(-half, 0, offset));
      points.push(new THREE.Vector3(half, 0, offset));
    }

    for (let i = 0; i <= size; i++) {
      const offset = -half + i;
      points.push(new THREE.Vector3(offset, 0, -half));
      points.push(new THREE.Vector3(offset, 0, half));
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [size]);

  const parsedColor = useMemo(() => new THREE.Color(color), [color]);

  const foamUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSize: { value: size },
  }), [size]);

  useFrame(({ clock }) => {
    if (foamMatRef.current) {
      foamMatRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <group position={position}>
      {/* Board surface — fully opaque so ocean doesn't bleed through */}
      <mesh position={[0, -0.03, 0]} receiveShadow>
        <boxGeometry args={[size, 0.05, size]} />
        <meshStandardMaterial
          color="#060c18"
          emissive={color}
          emissiveIntensity={0.10}
          metalness={0.55}
          roughness={0.45}
        />
      </mesh>

      {/* Primary grid lines */}
      <lineSegments geometry={gridGeometry} position={[0, 0.002, 0]}>
        <lineBasicMaterial
          color={parsedColor}
          transparent
          opacity={0.72}
          toneMapped={false}
        />
      </lineSegments>

      {/* Subtle glow lines overlay */}
      <lineSegments geometry={gridGeometry} position={[0, 0.004, 0]}>
        <lineBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.10}
          toneMapped={false}
        />
      </lineSegments>

      {/* Foam edge ring — where board meets water */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size + 1.6, size + 1.6]} />
        <shaderMaterial
          ref={foamMatRef}
          vertexShader={FOAM_VERT}
          fragmentShader={FOAM_FRAG}
          uniforms={foamUniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
