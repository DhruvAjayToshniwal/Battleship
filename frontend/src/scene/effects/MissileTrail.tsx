import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TRAIL_COUNT = 12;

export default function MissileTrail() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const timeRef = useRef(0);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const trailParticles = useMemo(() => {
    return Array.from({ length: TRAIL_COUNT }, (_, i) => ({
      delay: i * 0.03,
      scale: 0.04 + (TRAIL_COUNT - i) * 0.006,
      yOffset: -i * 0.15,
    }));
  }, []);

  useFrame((state, delta) => {
    timeRef.current += delta;
    const t = state.clock.elapsedTime;

    if (!meshRef.current) return;

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const p = trailParticles[i];
      const fade = Math.max(0, 1 - i / TRAIL_COUNT);
      const wobble = Math.sin(t * 10 + i) * 0.01;
      const s = p.scale * fade;

      dummy.position.set(wobble, p.yOffset, wobble * 0.5);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.opacity = 0.6;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TRAIL_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#ffaa00"
        emissive="#ff6600"
        emissiveIntensity={3}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
