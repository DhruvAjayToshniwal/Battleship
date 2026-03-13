import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import MissileTrail from './MissileTrail';

interface MissileSystemProps {
  position: [number, number, number];
  onImpact?: () => void;
}

const FLIGHT_DURATION = 0.6;
const START_HEIGHT = 12;

export default function MissileSystem({ position, onImpact }: MissileSystemProps) {
  const groupRef = useRef<THREE.Group>(null);
  const missileRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const elapsedRef = useRef(0);
  const impactedRef = useRef(false);
  const visibleRef = useRef(true);

  useFrame((_, delta) => {
    if (!visibleRef.current) return;

    elapsedRef.current += delta;
    const elapsed = elapsedRef.current;

    const progress = Math.min(elapsed / FLIGHT_DURATION, 1);
    const eased = progress * progress;
    const currentY = START_HEIGHT * (1 - eased);

    if (missileRef.current) {
      missileRef.current.position.y = currentY;
      missileRef.current.visible = progress < 1;
    }

    if (lightRef.current) {
      lightRef.current.position.y = currentY;
      lightRef.current.intensity = progress < 1 ? 3 : 0;
    }

    if (progress >= 1 && !impactedRef.current) {
      impactedRef.current = true;
      onImpact?.();
    }

    if (flashRef.current) {
      if (impactedRef.current) {
        const flashElapsed = elapsed - FLIGHT_DURATION;
        const flashProgress = Math.min(flashElapsed / 0.15, 1);
        flashRef.current.intensity = 8 * (1 - flashProgress);
      } else {
        flashRef.current.intensity = 0;
      }
    }

    if (elapsed > FLIGHT_DURATION + 0.3) {
      visibleRef.current = false;
      if (groupRef.current) groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <group>
        <mesh ref={missileRef}>
          <cylinderGeometry args={[0.02, 0.04, 0.3, 6]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#ff6600"
            emissiveIntensity={3}
          />
        </mesh>
        <MissileTrail />
      </group>

      <pointLight
        ref={lightRef}
        color="#ff6600"
        intensity={3}
        distance={6}
      />

      <pointLight
        ref={flashRef}
        color="#ff6600"
        intensity={0}
        distance={8}
        position={[0, 0.1, 0]}
      />
    </group>
  );
}
