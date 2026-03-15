import { useRef, memo } from 'react';
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

export default memo(function Cell({
  position,
  state,
  onClick,
  isPreview = false,
  isClickable = false,
  showShips: _showShips = true,
  isEnemyBoard = false,
}: CellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

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
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.25, 12, 12]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={1.0}
          />
        </mesh>
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
          <ringGeometry args={[0.2, 0.35, 12]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={0.5}
            side={THREE.DoubleSide}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
    );
  }

  // Ship cells are rendered by the fleet system (ShipFactory), not here

  if (isClickable) {
    return (
      <mesh
        ref={meshRef}
        position={[position[0], position[1] + 0.01, position[2]]}
        onPointerEnter={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'crosshair';
          if (matRef.current) {
            matRef.current.opacity = 0.7;
            matRef.current.emissiveIntensity = 0.4;
            matRef.current.color.set(isEnemyBoard ? '#1e3a5f' : '#1e3a5f');
            matRef.current.emissive.set(isEnemyBoard ? '#ef4444' : '#38bdf8');
          }
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'default';
          if (matRef.current) {
            matRef.current.opacity = 0.1;
            matRef.current.emissiveIntensity = 0;
            matRef.current.color.set('#0a1628');
            matRef.current.emissive.set('#000000');
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <boxGeometry args={[0.9, 0.02, 0.9]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0a1628"
          transparent
          opacity={0.1}
          emissive="#000000"
          emissiveIntensity={0}
        />
      </mesh>
    );
  }

  return null;
});
