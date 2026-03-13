import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShockwaveRingProps {
  position: [number, number, number];
  onComplete?: () => void;
}

const DURATION = 0.6;

export default function ShockwaveRing({ position, onComplete }: ShockwaveRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);

  useFrame((_, delta) => {
    if (completedRef.current) return;

    elapsedRef.current += delta;
    const t = elapsedRef.current;
    const progress = Math.min(t / DURATION, 1);

    if (meshRef.current) {
      const scale = 1 + progress * 4;
      meshRef.current.scale.set(scale, scale, 1);
    }

    if (materialRef.current) {
      materialRef.current.opacity = 0.8 * (1 - progress);
    }

    if (progress >= 1 && !completedRef.current) {
      completedRef.current = true;
      if (meshRef.current) meshRef.current.visible = false;
      onComplete?.();
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2, 0.4, 32]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#ff4400"
        emissive="#ff6600"
        emissiveIntensity={2}
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
