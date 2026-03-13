import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HitFlashProps {
  position: [number, number, number];
  color?: string;
  duration?: number;
}

export default function HitFlash({ position, color = '#ff6600', duration = 0.15 }: HitFlashProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);

  useFrame((_, delta) => {
    if (doneRef.current) return;

    elapsedRef.current += delta;
    const t = elapsedRef.current;
    const progress = Math.min(t / duration, 1);

    if (lightRef.current) {
      lightRef.current.intensity = 8 * (1 - progress);
    }

    if (progress >= 1) {
      doneRef.current = true;
      if (groupRef.current) groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <pointLight
        ref={lightRef}
        color={color}
        intensity={8}
        distance={8}
      />
    </group>
  );
}
