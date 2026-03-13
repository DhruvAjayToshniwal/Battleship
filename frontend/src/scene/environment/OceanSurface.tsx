import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createOceanMaterial } from '../materials/oceanMaterial';

interface OceanSurfaceProps {
  position?: [number, number, number];
  size?: [number, number];
  segments?: number;
}

export default function OceanSurface({
  position = [0, 0, 0],
  size = [60, 60],
  segments = 192,
}: OceanSurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => createOceanMaterial(), []);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[size[0], size[1], segments, segments]} />
    </mesh>
  );
}
