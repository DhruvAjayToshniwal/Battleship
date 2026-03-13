import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShipDamageFXProps {
  intensity: number;
}

const MAX_PARTICLES = 10;

export default function ShipDamageFX({ intensity }: ShipDamageFXProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);

  const particleCount = Math.max(4, Math.round(MAX_PARTICLES * intensity));

  const particles = useMemo(() => {
    return Array.from({ length: MAX_PARTICLES }, () => ({
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        0,
        (Math.random() - 0.5) * 0.4
      ),
      speed: 0.25 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      maxHeight: 0.4 + intensity * 0.8 + Math.random() * 0.4,
      baseScale: 0.04 + Math.random() * 0.05,
      driftDir: (Math.random() - 0.5) * 0.15,
    }));
  }, [intensity]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (meshRef.current) {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        if (i >= particleCount) {
          dummy.position.set(0, -10, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        const p = particles[i];
        const cycle = ((t * p.speed + p.phase) % 1.5) / 1.5;
        const y = cycle * p.maxHeight;
        const windDrift = Math.sin(t * 1.2 + p.phase) * 0.08 + p.driftDir * cycle;

        const growPhase = Math.min(cycle * 4, 1);
        const fadePhase = 1 - cycle * 0.6;
        const s = p.baseScale * intensity * growPhase * fadePhase;

        dummy.position.set(
          p.offset.x + windDrift,
          y + 0.2,
          p.offset.z + windDrift * 0.4
        );
        dummy.scale.set(s, s * 0.9, s);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (lightRef.current) {
      const flicker = 0.6 + Math.sin(t * 4.5) * 0.2 + Math.sin(t * 7.3) * 0.15 + Math.sin(t * 11.7) * 0.05;
      lightRef.current.intensity = intensity * 2.5 * Math.max(0.2, flicker);
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color="#777777"
          emissive="#663300"
          emissiveIntensity={0.4 * intensity}
          transparent
          opacity={0.55 * intensity}
          depthWrite={false}
        />
      </instancedMesh>
      <pointLight
        ref={lightRef}
        color="#ff5500"
        intensity={intensity * 2.5}
        distance={3}
        position={[0, 0.35, 0]}
      />
    </group>
  );
}
