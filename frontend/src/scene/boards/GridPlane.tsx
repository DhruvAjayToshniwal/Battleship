import { useMemo } from 'react';
import * as THREE from 'three';

interface GridPlaneProps {
  position?: [number, number, number];
  size?: number;
  color?: string;
}

export default function GridPlane({
  position = [0, 0, 0],
  size = 10,
  color = '#1e3a5f',
}: GridPlaneProps) {
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

  return (
    <group position={position}>
      <mesh position={[0, -0.025, 0]}>
        <boxGeometry args={[size, 0.05, size]} />
        <meshStandardMaterial
          color="#0a1628"
          emissive={color}
          emissiveIntensity={0.15}
          transparent
          opacity={0.85}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      <lineSegments geometry={gridGeometry} position={[0, 0.001, 0]}>
        <lineBasicMaterial
          color={parsedColor}
          transparent
          opacity={0.6}
          toneMapped={false}
        />
      </lineSegments>

      <lineSegments geometry={gridGeometry} position={[0, 0.003, 0]}>
        <lineBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.15}
          toneMapped={false}
        />
      </lineSegments>

      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.08}
          transparent
          opacity={0.1}
          metalness={0.6}
          roughness={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
