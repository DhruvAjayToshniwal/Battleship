import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createReticleMaterial } from '../materials/reticleMaterial';

interface TargetLockProps {
  position: [number, number, number];
  active: boolean;
}

export default function TargetLock({ position, active }: TargetLockProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const crossH = useRef<THREE.Mesh>(null);
  const crossV = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const reticleRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => createReticleMaterial(), []);

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.getElapsedTime();

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 2.5;
    }

    if (crossH.current) {
      crossH.current.rotation.y = t * 0.5;
    }

    if (crossV.current) {
      crossV.current.rotation.y = t * 0.5;
    }

    if (lightRef.current) {
      lightRef.current.intensity = 1.2 + Math.sin(t * 5) * 0.6;
    }

    if (reticleRef.current) {
      material.uniforms.uTime.value = t;
      material.uniforms.uActive.value = 1.0;
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[0.3, 0.38, 32]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={1.5}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={crossH} position={[0, 0.08, 0]}>
        <boxGeometry args={[0.65, 0.02, 0.035]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={crossV} position={[0, 0.08, 0]}>
        <boxGeometry args={[0.035, 0.02, 0.65]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>

      <mesh
        ref={reticleRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.06, 0]}
        material={material}
      >
        <planeGeometry args={[1.0, 1.0]} />
      </mesh>

      <pointLight
        ref={lightRef}
        position={[0, 0.15, 0]}
        color="#ef4444"
        intensity={1.2}
        distance={2.5}
      />
    </group>
  );
}
