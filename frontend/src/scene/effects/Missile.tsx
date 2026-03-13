import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MissileProps {
  position: [number, number, number];
  onImpact?: () => void;
}

const FLIGHT_DURATION = 0.6;
const START_HEIGHT = 12;
const TRAIL_COUNT = 8;

export default function Missile({ position, onImpact }: MissileProps) {
  const groupRef = useRef<THREE.Group>(null);
  const missileRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const elapsedRef = useRef(0);
  const impactedRef = useRef(false);
  const visibleRef = useRef(true);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const trailPositions = useMemo(() => {
    return Array.from({ length: TRAIL_COUNT }, (_, i) => ({
      delay: i * 0.04,
      scale: 0.03 + (TRAIL_COUNT - i) * 0.005,
    }));
  }, []);

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

    if (trailRef.current) {
      for (let i = 0; i < TRAIL_COUNT; i++) {
        const tp = trailPositions[i];
        const trailProgress = Math.max(0, progress - tp.delay * 2);
        const trailY = START_HEIGHT * (1 - trailProgress * trailProgress);
        const fade = Math.max(0, 1 - (progress - tp.delay) * 3);

        dummy.position.set(0, trailY, 0);
        const s = tp.scale * fade;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        trailRef.current.setMatrixAt(i, dummy.matrix);
      }
      trailRef.current.instanceMatrix.needsUpdate = true;
    }

    if (progress >= 1 && !impactedRef.current) {
      impactedRef.current = true;
      onImpact?.();
    }

    if (elapsed > FLIGHT_DURATION + 0.1) {
      visibleRef.current = false;
      if (groupRef.current) groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={missileRef}>
        <cylinderGeometry args={[0.02, 0.04, 0.3, 6]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#ff6600"
          emissiveIntensity={3}
        />
      </mesh>

      <instancedMesh ref={trailRef} args={[undefined, undefined, TRAIL_COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ff4400"
          emissiveIntensity={2}
          transparent
          opacity={0.6}
        />
      </instancedMesh>

      <pointLight
        ref={lightRef}
        color="#ff6600"
        intensity={3}
        distance={6}
      />
    </group>
  );
}
