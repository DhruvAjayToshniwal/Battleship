import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CellProps {
  position: [number, number, number];
  state: string | null; // null, 'ship', 'hit', 'miss'
  onClick?: () => void;
  isPreview?: boolean;
  isClickable?: boolean;
  showShips?: boolean;
}

export default function Cell({
  position,
  state,
  onClick,
  isPreview = false,
  isClickable = false,
  showShips = true,
}: CellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef<THREE.PointLight>(null);


  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      if (state === 'hit' && glowRef.current) {
        glowRef.current.intensity = 1.5 + Math.sin(t * 3) * 0.5;
      }
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
        {/* Base marker */}
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

  // Empty / clickable cell
  if (isClickable) {
    return (
      <mesh
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
          color={hovered ? '#1e3a5f' : '#0a1628'}
          transparent
          opacity={hovered ? 0.6 : 0.1}
          emissive={hovered ? '#38bdf8' : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>
    );
  }

  return null;
}
