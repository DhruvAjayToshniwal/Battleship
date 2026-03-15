import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShipWakeProps {
  length: number;
  isHorizontal: boolean;
}

const PARTICLE_COUNT = 6;

function createWakeTrailGeometry(length: number, isHorizontal: boolean, side: number): THREE.BufferGeometry {
  const trailLength = length * 0.55;
  const spread = 0.18 * side;
  const geometry = new THREE.BufferGeometry();

  const vertices = isHorizontal
    ? new Float32Array([
        -trailLength, 0, 0,
        -trailLength * 0.5, 0, spread * 0.6,
        0, 0, spread * 0.25,
        0, 0, 0,
      ])
    : new Float32Array([
        0, 0, -trailLength,
        spread * 0.6, 0, -trailLength * 0.5,
        spread * 0.25, 0, 0,
        0, 0, 0,
      ]);

  const indices = new Uint16Array([0, 1, 3, 1, 2, 3]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
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
    return isHorizontal ? [-offset, -0.03, 0] : [0, -0.03, -offset];
  }, [length, isHorizontal]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;
    const t = timeRef.current;

    const opacityPulse = 0.15 + Math.sin(t * 2) * 0.05;
    const scalePulse = 1 + Math.sin(t * 1.5) * 0.06;

    if (mat1Ref.current) mat1Ref.current.opacity = opacityPulse;
    if (mat2Ref.current) mat2Ref.current.opacity = opacityPulse;

    if (trail1Ref.current) trail1Ref.current.scale.set(scalePulse, 1, scalePulse);
    if (trail2Ref.current) trail2Ref.current.scale.set(scalePulse, 1, scalePulse);

    if (instanceRef.current) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const phase = (t * 0.7 + i * 0.22) % 1;
        const trailDist = phase * length * 0.65;
        const spread = (i % 2 === 0 ? 0.08 : -0.08) * (1 + phase * 0.5);
        const px = isHorizontal ? -trailDist : spread;
        const pz = isHorizontal ? spread : -trailDist;
        const s = 0.025 * (1 - phase * 0.8);

        dummy.position.set(px, -0.01, pz);
        dummy.scale.set(s, s * 0.5, s);
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
          color="#c0e0f0"
          emissive="#60aacc"
          emissiveIntensity={0.35}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={trail2Ref} geometry={trail2Geo}>
        <meshStandardMaterial
          ref={mat2Ref}
          color="#c0e0f0"
          emissive="#60aacc"
          emissiveIntensity={0.35}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <instancedMesh ref={instanceRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 5, 5]} />
        <meshStandardMaterial
          color="#d0f0ff"
          emissive="#55ccee"
          emissiveIntensity={0.5}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
