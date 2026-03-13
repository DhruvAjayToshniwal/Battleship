import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SmokeEffectProps {
  position: [number, number, number];
}

const PARTICLE_COUNT = 6;

export default function SmokeEffect({ position }: SmokeEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      offset: i * (Math.PI * 2) / PARTICLE_COUNT,
      speed: 0.3 + Math.random() * 0.2,
      drift: (Math.random() - 0.5) * 0.3,
      baseScale: 0.04 + Math.random() * 0.03,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const cycle = (t * p.speed + p.offset) % 2.0;
      const progress = cycle / 2.0;

      dummy.position.set(
        p.drift * progress,
        progress * 1.2,
        p.drift * progress * 0.5
      );

      const scale = p.baseScale * (0.5 + progress) * (1 - progress * 0.5);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color="#555555"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </instancedMesh>

      <pointLight
        color="#ff4400"
        intensity={0.6}
        distance={2}
        position={[0, 0.3, 0]}
      />
    </group>
  );
}
