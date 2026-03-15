import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SmokeEffectProps {
  position: [number, number, number];
}

const PARTICLE_COUNT = 4;

export default function SmokeEffect({ position }: SmokeEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      offset: i * (Math.PI * 2) / PARTICLE_COUNT,
      speed: 0.2 + Math.random() * 0.15,
      drift: (Math.random() - 0.5) * 0.4,
      driftZ: (Math.random() - 0.5) * 0.3,
      baseScale: 0.06 + Math.random() * 0.04,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const cycle = (t * p.speed + p.offset) % 2.5;
      const progress = cycle / 2.5;

      dummy.position.set(
        p.drift * progress * 1.2,
        progress * 1.8 + Math.sin(t * 0.5 + p.offset) * 0.1,
        p.driftZ * progress
      );

      const growPhase = Math.min(progress * 3, 1);
      const fadePhase = Math.max(0, 1 - progress);
      const scale = p.baseScale * growPhase * (0.6 + fadePhase * 0.4);
      dummy.scale.set(scale, scale * 0.8, scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshStandardMaterial
          color="#888888"
          emissive="#442200"
          emissiveIntensity={0.3}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
