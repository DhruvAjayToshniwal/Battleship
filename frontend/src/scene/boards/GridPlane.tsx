import { useMemo } from 'react';
import * as THREE from 'three';

interface GridPlaneProps {
  position?: [number, number, number];
  size?: number;
}

export default function GridPlane({ position = [0, 0, 0], size = 10 }: GridPlaneProps) {
  const geometry = useMemo(() => {
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

  return (
    <group position={position}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          color="#1e90ff"
          transparent
          opacity={0.6}
          linewidth={1}
        />
      </lineSegments>

      <lineSegments geometry={geometry} position={[0, 0.001, 0]}>
        <lineBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.2}
          linewidth={1}
        />
      </lineSegments>

      <mesh position={[0, -0.01, 0]}>
        <boxGeometry args={[size, 0.02, size]} />
        <meshStandardMaterial
          color="#0a1628"
          emissive="#0a1628"
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}
