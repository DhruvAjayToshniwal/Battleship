import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShipDamageFXProps {
  intensity: number; // 0..1
}

const SMOKE_COUNT = 10;
const FIRE_COUNT = 6;

export default function ShipDamageFX({ intensity }: ShipDamageFXProps) {
  const smokeRef = useRef<THREE.InstancedMesh>(null);
  const fireRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);

  const smokeCount = Math.max(3, Math.round(SMOKE_COUNT * intensity));
  const fireCount = intensity > 0.3 ? Math.max(2, Math.round(FIRE_COUNT * intensity)) : 0;

  const smokeParticles = useMemo(() =>
    Array.from({ length: SMOKE_COUNT }, () => ({
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 0.35,
        0,
        (Math.random() - 0.5) * 0.35,
      ),
      speed: 0.22 + Math.random() * 0.30,
      phase: Math.random() * Math.PI * 2,
      maxHeight: 0.5 + intensity * 0.9 + Math.random() * 0.4,
      baseScale: 0.045 + Math.random() * 0.05,
      drift: (Math.random() - 0.5) * 0.12,
    })),
    [intensity],
  );

  const fireParticles = useMemo(() =>
    Array.from({ length: FIRE_COUNT }, () => ({
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        0,
        (Math.random() - 0.5) * 0.25,
      ),
      speed: 0.4 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      maxHeight: 0.25 + Math.random() * 0.3,
      baseScale: 0.03 + Math.random() * 0.04,
    })),
    [intensity],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;
    const t = timeRef.current;

    // Smoke particles
    if (smokeRef.current) {
      for (let i = 0; i < SMOKE_COUNT; i++) {
        if (i >= smokeCount) {
          dummy.position.set(0, -10, 0);
          dummy.scale.set(0, 0, 0);
        } else {
          const p = smokeParticles[i];
          const cycle = ((t * p.speed + p.phase) % 1.5) / 1.5;
          const y = cycle * p.maxHeight;
          const wind = Math.sin(t * 1.1 + p.phase) * 0.07 + p.drift * cycle;
          const grow = Math.min(cycle * 4, 1);
          const fade = 1 - cycle * 0.5;
          const s = p.baseScale * intensity * grow * fade;

          dummy.position.set(p.offset.x + wind, y + 0.22, p.offset.z + wind * 0.4);
          dummy.scale.set(s, s * 0.85, s);
        }
        dummy.updateMatrix();
        smokeRef.current.setMatrixAt(i, dummy.matrix);
      }
      smokeRef.current.instanceMatrix.needsUpdate = true;
    }

    // Fire particles
    if (fireRef.current) {
      for (let i = 0; i < FIRE_COUNT; i++) {
        if (i >= fireCount) {
          dummy.position.set(0, -10, 0);
          dummy.scale.set(0, 0, 0);
        } else {
          const p = fireParticles[i];
          const cycle = ((t * p.speed + p.phase) % 0.8) / 0.8;
          const y = cycle * p.maxHeight;
          const flicker = 0.7 + Math.sin(t * 8 + p.phase) * 0.3;
          const s = p.baseScale * intensity * (1 - cycle) * flicker;

          dummy.position.set(p.offset.x, y + 0.18, p.offset.z);
          dummy.scale.set(s, s * 1.4, s);
        }
        dummy.updateMatrix();
        fireRef.current.setMatrixAt(i, dummy.matrix);
      }
      fireRef.current.instanceMatrix.needsUpdate = true;
    }

    // Flickering light
    if (lightRef.current) {
      const flicker = 0.5 + Math.sin(t * 5.2) * 0.2 + Math.sin(t * 8.1) * 0.15 + Math.sin(t * 13) * 0.1;
      lightRef.current.intensity = intensity * 3.0 * Math.max(0.15, flicker);
    }
  });

  return (
    <group>
      {/* Smoke */}
      <instancedMesh ref={smokeRef} args={[undefined, undefined, SMOKE_COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color="#666666"
          emissive="#553300"
          emissiveIntensity={0.3 * intensity}
          transparent
          opacity={0.50 * intensity}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Fire */}
      {fireCount > 0 && (
        <instancedMesh ref={fireRef} args={[undefined, undefined, FIRE_COUNT]}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial
            color="#ff6600"
            emissive="#ff4400"
            emissiveIntensity={1.2 * intensity}
            transparent
            opacity={0.7 * intensity}
            depthWrite={false}
          />
        </instancedMesh>
      )}

      <pointLight
        ref={lightRef}
        color="#ff5500"
        intensity={intensity * 3}
        distance={3.5}
        position={[0, 0.35, 0]}
        decay={2}
      />
    </group>
  );
}
