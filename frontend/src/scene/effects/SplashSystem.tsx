import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SplashSystemProps {
  position: [number, number, number];
  onComplete?: () => void;
}

const PARTICLE_COUNT = 16;
const DURATION = 1.0;

export default function SplashSystem({ position, onComplete }: SplashSystemProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const columnRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const particleMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const columnMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const visibleRef = useRef(true);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1;
      return {
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.random() * 2 + 1.5,
          Math.sin(angle) * speed
        ),
        scale: 0.03 + Math.random() * 0.05,
        life: 0.4 + Math.random() * 0.5,
      };
    });
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
        p.velocity.x * t * 0.5,
        p.velocity.y * t - 5 * t * t,
        p.velocity.z * t * 0.5
      );

      const scale = p.scale * (1 - lifeProgress * 0.8);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    if (particleMaterialRef.current) {
      particleMaterialRef.current.opacity = Math.max(0, 1 - t / DURATION);
    }

    if (ringRef.current) {
      const ringScale = 1 + t * 3;
      ringRef.current.scale.set(ringScale, ringScale, 1);
    }
    if (ringMaterialRef.current) {
      ringMaterialRef.current.opacity = Math.max(0, 0.7 * (1 - t / DURATION));
    }

    if (columnRef.current) {
      const columnProgress = Math.min(t / 0.3, 1);
      const columnHeight = 1.5 * columnProgress * Math.max(0, 1 - (t - 0.2) / 0.6);
      const columnY = columnHeight / 2;
      columnRef.current.position.y = columnY;
      columnRef.current.scale.set(1, Math.max(0.01, columnHeight), 1);
      columnRef.current.visible = t < 0.8;
    }
    if (columnMaterialRef.current) {
      columnMaterialRef.current.opacity = Math.max(0, 0.5 * (1 - t / 0.8));
    }

    if (lightRef.current) {
      lightRef.current.intensity = Math.max(0, 4 * (1 - t / DURATION));
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          ref={particleMaterialRef}
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={1}
          transparent
          opacity={1}
        />
      </instancedMesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.15, 0.3, 32]} />
        <meshStandardMaterial
          ref={ringMaterialRef}
          color="#7dd3fc"
          emissive="#38bdf8"
          emissiveIntensity={1}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={columnRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.12, 1, 8]} />
        <meshStandardMaterial
          ref={columnMaterialRef}
          color="#bae6fd"
          emissive="#38bdf8"
          emissiveIntensity={0.8}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      <pointLight
        ref={lightRef}
        color="#38bdf8"
        intensity={4}
        distance={5}
        position={[0, 0.5, 0]}
      />
    </group>
  );
}
