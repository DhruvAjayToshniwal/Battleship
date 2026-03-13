import { useMemo } from 'react';
import * as THREE from 'three';

interface GridProps {
  position?: [number, number, number];
  size?: number;
  cellSize?: number;
}

export default function Grid({ position = [0, 0, 0], size = 10, cellSize = 1 }: GridProps) {
  const lines = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const half = (size * cellSize) / 2;

    // Horizontal lines
    for (let i = 0; i <= size; i++) {
      const z = -half + i * cellSize;
      points.push(new THREE.Vector3(-half, 0, z));
      points.push(new THREE.Vector3(half, 0, z));
    }

    // Vertical lines
    for (let i = 0; i <= size; i++) {
      const x = -half + i * cellSize;
      points.push(new THREE.Vector3(x, 0, -half));
      points.push(new THREE.Vector3(x, 0, half));
    }

    return points;
  }, [size, cellSize]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(lines);
    return geo;
  }, [lines]);

  return (
    <group position={position}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          color="#1e293b"
          transparent
          opacity={0.7}
          linewidth={1}
        />
      </lineSegments>
      {/* Subtle glow layer */}
      <lineSegments geometry={geometry} position={[0, 0.001, 0]}>
        <lineBasicMaterial
          color="#334155"
          transparent
          opacity={0.3}
          linewidth={1}
        />
      </lineSegments>
    </group>
  );
}
