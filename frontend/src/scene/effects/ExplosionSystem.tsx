import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ShockwaveRing from './ShockwaveRing';

interface ExplosionSystemProps {
  position: [number, number, number];
  onComplete?: () => void;
}

const PARTICLE_COUNT = 24;
const SECONDARY_COUNT = 6;
const TOTAL_PARTICLES = PARTICLE_COUNT + SECONDARY_COUNT;
const DURATION = 1.2;
const SECONDARY_DELAY = 0.15;

export default function ExplosionSystem({ position, onComplete }: ExplosionSystemProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const visibleRef = useRef(true);

  const particles = useMemo(() => {
    const primary = Array.from({ length: PARTICLE_COUNT }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 3
      ),
      scale: 0.05 + Math.random() * 0.1,
      life: 0.5 + Math.random() * 0.7,
      delay: 0,
    }));

    const secondary = Array.from({ length: SECONDARY_COUNT }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2 + 0.5,
        (Math.random() - 0.5) * 2
      ),
      scale: 0.06 + Math.random() * 0.08,
      life: 0.6 + Math.random() * 0.5,
      delay: SECONDARY_DELAY,
    }));

    return [...primary, ...secondary];
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!visibleRef.current || !meshRef.current) return;

    elapsedRef.current += delta;
    const t = elapsedRef.current;

    if (t > DURATION && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
      visibleRef.current = false;
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const p = particles[i];
      const elapsed = Math.max(0, t - p.delay);

      if (elapsed <= 0) {
        dummy.position.set(0, -10, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      const lifeProgress = Math.min(elapsed / p.life, 1);

      dummy.position.set(
        p.velocity.x * elapsed * (1 - lifeProgress * 0.5),
        p.velocity.y * elapsed - 4.9 * elapsed * elapsed,
        p.velocity.z * elapsed * (1 - lifeProgress * 0.5)
      );

      const scale = p.scale * (1 - lifeProgress);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.opacity = Math.max(0, 1 - t / DURATION);
    }

    if (flashRef.current) {
      if (t < 0.2) {
        flashRef.current.visible = true;
        flashRef.current.intensity = 15 * (1 - t / 0.2);
      } else {
        flashRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, TOTAL_PARTICLES]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#ef4444"
          emissive="#ff6600"
          emissiveIntensity={2}
          transparent
          opacity={1}
        />
      </instancedMesh>
      <pointLight
        ref={flashRef}
        color="#ff4400"
        intensity={15}
        distance={6}
      />
      <ShockwaveRing position={[0, 0.05, 0]} />
    </group>
  );
}
