import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CellProps {
  position: [number, number, number];
  state: string | null;
  onClick?: () => void;
  isPreview?: boolean;
  isClickable?: boolean;
  showShips?: boolean;
  isEnemyBoard?: boolean;
}

export default function Cell({
  position,
  state,
  onClick,
  isPreview = false,
  isClickable = false,
  showShips = true,
  isEnemyBoard = false,
}: CellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef<THREE.PointLight>(null);
  const reticleRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (state === 'hit' && glowRef.current) {
      glowRef.current.intensity = 1.5 + Math.sin(t * 3) * 0.5;
    }
    if (hovered && isEnemyBoard && reticleRef.current) {
      reticleRef.current.rotation.z = t * 2;
      const pulse = 1 + Math.sin(t * 4) * 0.1;
      reticleRef.current.scale.set(pulse, pulse, 1);
    }
  });

  if (isPreview) {
    return (
      <mesh position={[position[0], position[1] + 0.05, position[2]]}>
        <boxGeometry args={[0.9, 0.1, 0.9]} />
        <meshStandardMaterial
          color="#22c55e"
          transparent
          opacity={0.4}
          emissive="#22c55e"
          emissiveIntensity={0.3}
        />
      </mesh>
    );
  }

  if (state === 'hit') {
    return (
      <group position={position}>
        <mesh position={[0, 0.25, 0]} ref={meshRef}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.8}
          />
        </mesh>
        <pointLight
          ref={glowRef}
          position={[0, 0.5, 0]}
          color="#ef4444"
          intensity={1.5}
          distance={3}
        />
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.9, 0.04, 0.9]} />
          <meshStandardMaterial
            color="#991b1b"
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    );
  }

  if (state === 'miss') {
    return (
      <group position={position}>
        <mesh position={[0, 0.02, 0]}>
          <ringGeometry args={[0.2, 0.35, 16]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={0.5}
            side={THREE.DoubleSide}
            transparent
            opacity={0.7}
          />
        </mesh>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.15, 16]} />
          <meshStandardMaterial
            color="#7dd3fc"
            emissive="#7dd3fc"
            emissiveIntensity={0.3}
            side={THREE.DoubleSide}
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>
    );
  }

  if (state === 'ship' && showShips) {
    return (
      <mesh position={[position[0], position[1] + 0.08, position[2]]}>
        <boxGeometry args={[0.85, 0.16, 0.85]} />
        <meshStandardMaterial
          color="#475569"
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
    );
  }

  if (isClickable) {
    return (
      <group>
        <mesh
          ref={meshRef}
          position={[position[0], position[1] + 0.01, position[2]]}
          onPointerEnter={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'crosshair';
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = 'default';
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <boxGeometry args={[0.9, 0.02, 0.9]} />
          <meshStandardMaterial
            color={hovered ? (isEnemyBoard ? '#1e3a5f' : '#1e3a5f') : '#0a1628'}
            transparent
            opacity={hovered ? 0.7 : 0.1}
            emissive={hovered ? (isEnemyBoard ? '#ef4444' : '#38bdf8') : '#000000'}
            emissiveIntensity={hovered ? 0.4 : 0}
          />
        </mesh>
        {/* Target reticle on enemy board hover */}
        {hovered && isEnemyBoard && (
          <>
            <mesh
              ref={reticleRef}
              position={[position[0], position[1] + 0.06, position[2]]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.3, 0.38, 4]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#ef4444"
                emissiveIntensity={1}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
            <pointLight
              position={[position[0], position[1] + 0.3, position[2]]}
              color="#ef4444"
              intensity={1.5}
              distance={2}
            />
          </>
        )}
      </group>
    );
  }

  return null;
}
