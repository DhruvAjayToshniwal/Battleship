import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShipWakeProps {
  length: number;
  isHorizontal: boolean;
}

const PARTICLE_COUNT = 4;

function createWakeTrailGeometry(length: number, isHorizontal: boolean, side: number): THREE.BufferGeometry {
  const trailLength = length * 0.5;
  const spread = 0.15 * side;
  const geometry = new THREE.BufferGeometry();

  const vertices = isHorizontal
    ? new Float32Array([
        -trailLength, 0, 0,
        0, 0, spread * 0.3,
        0, 0, 0,
      ])
    : new Float32Array([
        0, 0, -trailLength,
        spread * 0.3, 0, 0,
        0, 0, 0,
      ]);

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export default function ShipWake({ length, isHorizontal }: ShipWakeProps) {
  const trail1Ref = useRef<THREE.Mesh>(null);
  const trail2Ref = useRef<THREE.Mesh>(null);
  const instanceRef = useRef<THREE.InstancedMesh>(null);
  const mat1Ref = useRef<THREE.MeshStandardMaterial>(null);
  const mat2Ref = useRef<THREE.MeshStandardMaterial>(null);
  const timeRef = useRef(0);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const trail1Geo = useMemo(() => createWakeTrailGeometry(length, isHorizontal, 1), [length, isHorizontal]);
  const trail2Geo = useMemo(() => createWakeTrailGeometry(length, isHorizontal, -1), [length, isHorizontal]);

  const sternOffset: [number, number, number] = useMemo(() => {
    const offset = length * 0.46;
    return isHorizontal ? [-offset, -0.04, 0] : [0, -0.04, -offset];
  }, [length, isHorizontal]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    const opacityPulse = 0.12 + Math.sin(t * 2) * 0.04;
    const scalePulse = 1 + Math.sin(t * 1.5) * 0.05;

    if (mat1Ref.current) mat1Ref.current.opacity = opacityPulse;
    if (mat2Ref.current) mat2Ref.current.opacity = opacityPulse;

    if (trail1Ref.current) {
      trail1Ref.current.scale.set(scalePulse, 1, scalePulse);
    }
    if (trail2Ref.current) {
      trail2Ref.current.scale.set(scalePulse, 1, scalePulse);
    }

    if (instanceRef.current) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const phase = (t * 0.8 + i * 0.25) % 1;
        const trailDist = phase * length * 0.6;
        const px = isHorizontal ? -trailDist : (i % 2 === 0 ? 0.06 : -0.06);
        const pz = isHorizontal ? (i % 2 === 0 ? 0.06 : -0.06) : -trailDist;
        const s = 0.02 * (1 - phase);

        dummy.position.set(px, 0, pz);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        instanceRef.current.setMatrixAt(i, dummy.matrix);
      }
      instanceRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={sternOffset}>
      <mesh ref={trail1Ref} geometry={trail1Geo}>
        <meshStandardMaterial
          ref={mat1Ref}
          color="#ffffff"
          emissive="#88ddff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={trail2Ref} geometry={trail2Geo}>
        <meshStandardMaterial
          ref={mat2Ref}
          color="#ffffff"
          emissive="#88ddff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <instancedMesh ref={instanceRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshStandardMaterial
          color="#ccffff"
          emissive="#66ddff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
