import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TargetLockProps {
  position: [number, number, number];
  active: boolean;
}

export default function TargetLock({ position, active }: TargetLockProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 2.5;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1.0 + Math.sin(t * 5) * 0.5;
    }
  });

  if (!active) return null;

  return (
    <group position={position}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[0.3, 0.38, 32]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={1.0}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.04]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={0.8}
        />
      </mesh>

      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.04, 0.02, 0.6]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={0.8}
        />
      </mesh>

      <pointLight
        ref={lightRef}
        position={[0, 0.3, 0]}
        color="#ef4444"
        intensity={1.0}
        distance={2.5}
      />
    </group>
  );
}
