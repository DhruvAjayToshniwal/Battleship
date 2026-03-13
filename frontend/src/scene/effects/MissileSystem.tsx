import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import MissileTrail from './MissileTrail';

interface MissileSystemProps {
  position: [number, number, number];
  onImpact?: () => void;
}

const FLIGHT_DURATION = 0.8;
const START_HEIGHT = 14;
const ARC_OFFSET_X = -3;

export default function MissileSystem({ position, onImpact }: MissileSystemProps) {
  const groupRef = useRef<THREE.Group>(null);
  const missileRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const elapsedRef = useRef(0);
  const impactedRef = useRef(false);
  const visibleRef = useRef(true);
  const prevPos = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!visibleRef.current) return;

    elapsedRef.current += delta;
    const elapsed = elapsedRef.current;
    const progress = Math.min(elapsed / FLIGHT_DURATION, 1);

    const t = progress;
    const arcX = ARC_OFFSET_X * (1 - t);
    const arcY = START_HEIGHT * (1 - t * t) + 2 * t * (1 - t) * 4;
    const arcZ = 0;

    if (missileRef.current) {
      const currentPos = missileRef.current.position;
      prevPos.current.copy(currentPos);

      currentPos.set(arcX, arcY, arcZ);
      missileRef.current.visible = progress < 1;

      const dir = new THREE.Vector3().subVectors(currentPos, prevPos.current);
      if (dir.lengthSq() > 0.0001) {
        dir.normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
        missileRef.current.quaternion.copy(quat);
      }
    }

    if (lightRef.current) {
      lightRef.current.position.set(arcX, arcY, arcZ);
      lightRef.current.intensity = progress < 1 ? 3 * (0.7 + 0.3 * Math.sin(elapsed * 20)) : 0;
    }

    if (progress >= 1 && !impactedRef.current) {
      impactedRef.current = true;
      onImpact?.();
    }

    if (flashRef.current) {
      if (impactedRef.current) {
        const flashElapsed = elapsed - FLIGHT_DURATION;
        const flashProgress = Math.min(flashElapsed / 0.2, 1);
        flashRef.current.intensity = 10 * (1 - flashProgress * flashProgress);
      } else {
        flashRef.current.intensity = 0;
      }
    }

    if (elapsed > FLIGHT_DURATION + 0.4) {
      visibleRef.current = false;
      if (groupRef.current) groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <group>
        <mesh ref={missileRef}>
          <cylinderGeometry args={[0.015, 0.05, 0.35, 8]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#ff6600"
            emissiveIntensity={4}
          />
        </mesh>
        <MissileTrail />
      </group>

      <pointLight
        ref={lightRef}
        color="#ff8800"
        intensity={3}
        distance={8}
      />

      <pointLight
        ref={flashRef}
        color="#ff4400"
        intensity={0}
        distance={10}
        position={[0, 0.1, 0]}
      />
    </group>
  );
}
