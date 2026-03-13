import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExplosionProps {
  position: [number, number, number];
  onComplete?: () => void;
}

const PARTICLE_COUNT = 24;
const DURATION = 1.2;

export default function Explosion({ position, onComplete }: ExplosionProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [elapsed, setElapsed] = useState(0);
  const completedRef = useRef(false);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 3
      ),
      color: new THREE.Color().setHSL(
        Math.random() * 0.1 + 0.02, // red-orange hue
        1,
        0.5 + Math.random() * 0.3
      ),
      scale: 0.05 + Math.random() * 0.1,
      life: 0.5 + Math.random() * 0.7,
    }));
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const newElapsed = elapsed + delta;
    setElapsed(newElapsed);

    if (newElapsed > DURATION && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
      return;
    }

    const t = newElapsed;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const lifeProgress = Math.min(t / p.life, 1);

      dummy.position.set(
        p.velocity.x * t * (1 - lifeProgress * 0.5),
        p.velocity.y * t - 4.9 * t * t, // gravity
        p.velocity.z * t * (1 - lifeProgress * 0.5)
      );

      const scale = p.scale * (1 - lifeProgress);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (elapsed > DURATION) return null;

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ff6600"
          emissiveIntensity={2}
          transparent
          opacity={Math.max(0, 1 - elapsed / DURATION)}
        />
      </instancedMesh>
      {/* Flash */}
      {elapsed < 0.2 && (
        <pointLight
          color="#ff4400"
          intensity={10 * (1 - elapsed / 0.2)}
          distance={5}
        />
      )}
    </group>
  );
}
