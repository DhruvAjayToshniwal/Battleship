import { useMemo } from 'react';

interface ShipProps {
  coordinates: string[];
  isPreview?: boolean;
}

export default function Ship({ coordinates, isPreview = false }: ShipProps) {
  const size = coordinates.length;

  // Determine orientation and start position
  const isHorizontal = useMemo(() => {
    if (size <= 1) return true;
    return coordinates[0][0] !== coordinates[1][0];
  }, [coordinates, size]);

  // We render each coordinate as a block
  return (
    <group>
      {coordinates.map((coord, i) => {
        const col = coord.charCodeAt(0) - 65;
        const row = parseInt(coord.slice(1), 10) - 1;
        const half = 5;
        const x = col - half + 0.5;
        const z = row - half + 0.5;

        // Shape the ends of the ship
        const isEnd = i === 0 || i === size - 1;
        const scaleX = isHorizontal ? (isEnd ? 0.75 : 0.85) : 0.7;
        const scaleZ = !isHorizontal ? (isEnd ? 0.75 : 0.85) : 0.7;
        const height = isEnd ? 0.14 : 0.18;

        return (
          <mesh key={coord} position={[x, 0.09 + height / 2, z]}>
            <boxGeometry args={[scaleX, height, scaleZ]} />
            <meshStandardMaterial
              color={isPreview ? '#22c55e' : '#475569'}
              transparent
              opacity={isPreview ? 0.5 : 1}
              emissive={isPreview ? '#22c55e' : '#1e293b'}
              emissiveIntensity={isPreview ? 0.4 : 0.1}
              roughness={0.8}
              metalness={0.3}
            />
          </mesh>
        );
      })}
      {/* Superstructure for non-preview ships */}
      {!isPreview && size >= 3 && (
        (() => {
          const midIdx = Math.floor(size / 2);
          const midCoord = coordinates[midIdx];
          const col = midCoord.charCodeAt(0) - 65;
          const row = parseInt(midCoord.slice(1), 10) - 1;
          const half = 5;
          const x = col - half + 0.5;
          const z = row - half + 0.5;
          return (
            <mesh position={[x, 0.3, z]}>
              <boxGeometry args={[0.3, 0.12, 0.3]} />
              <meshStandardMaterial
                color="#64748b"
                roughness={0.6}
                metalness={0.4}
              />
            </mesh>
          );
        })()
      )}
    </group>
  );
}
