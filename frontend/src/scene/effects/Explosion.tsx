import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExplosionProps {
  position: [number, number, number];
  onComplete?: () => void;
}

const PARTICLE_COUNT = 24;
const DURATION = 1.2;

export default function Explosion({ position, onComplete }: ExplosionProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const visibleRef = useRef(true);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 3
      ),
      scale: 0.05 + Math.random() * 0.1,
      life: 0.5 + Math.random() * 0.7,
    }));
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

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const lifeProgress = Math.min(t / p.life, 1);

      dummy.position.set(
        p.velocity.x * t * (1 - lifeProgress * 0.5),
        p.velocity.y * t - 4.9 * t * t,
        p.velocity.z * t * (1 - lifeProgress * 0.5)
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
        flashRef.current.intensity = 10 * (1 - t / 0.2);
      } else {
        flashRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
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
        intensity={10}
        distance={5}
      />
    </group>
  );
}
