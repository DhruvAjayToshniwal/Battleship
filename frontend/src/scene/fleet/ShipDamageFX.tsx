import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShipDamageFXProps {
  intensity: number;
}

const MAX_PARTICLES = 8;

export default function ShipDamageFX({ intensity }: ShipDamageFXProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);

  const particleCount = Math.max(4, Math.round(MAX_PARTICLES * intensity));

  const particles = useMemo(() => {
    return Array.from({ length: MAX_PARTICLES }, () => ({
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        0,
        (Math.random() - 0.5) * 0.3
      ),
      speed: 0.3 + Math.random() * 0.5,
      phase: Math.random(),
      maxHeight: 0.3 + intensity * 0.7 + Math.random() * 0.3,
      baseScale: 0.03 + Math.random() * 0.04,
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
        const cycle = ((t * p.speed + p.phase) % 1);
        const y = cycle * p.maxHeight;
        const drift = Math.sin(t * 2 + p.phase * 6) * 0.05;
        const s = p.baseScale * intensity * (1 - cycle * 0.5);

        dummy.position.set(
          p.offset.x + drift,
          y + 0.2,
          p.offset.z + drift * 0.5
        );
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (lightRef.current) {
      const flicker = 0.5 + Math.sin(t * 15) * 0.3 + Math.sin(t * 23) * 0.2;
      lightRef.current.intensity = intensity * 3 * Math.max(0, flicker);
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color="#444444"
          emissive="#222222"
          emissiveIntensity={0.3}
          transparent
          opacity={0.5 * intensity}
          depthWrite={false}
        />
      </instancedMesh>
      <pointLight
        ref={lightRef}
        color="#ff6600"
        intensity={intensity * 3}
        distance={2}
        position={[0, 0.3, 0]}
      />
    </group>
  );
}
