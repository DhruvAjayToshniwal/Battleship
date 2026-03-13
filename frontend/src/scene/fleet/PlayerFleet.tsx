import { useMemo } from 'react';
import ShipFactory from './ShipFactory';
import { coordToRowCol } from '../../utils/coordinates';

interface PlayerFleetProps {
  shipCoordinates: string[][];
  previewCoords?: string[] | null;
  grid: (string | null)[][];
}

function calculateDamage(coords: string[], grid: (string | null)[][]): number {
  if (coords.length === 0) return 0;
  let hitCount = 0;
  for (const coord of coords) {
    const [row, col] = coordToRowCol(coord);
    if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
      if (grid[row][col] === 'hit') {
        hitCount++;
      }
    }
  }
  return hitCount / coords.length;
}

export default function PlayerFleet({ shipCoordinates, previewCoords, grid }: PlayerFleetProps) {
  const ships = useMemo(() => {
    return shipCoordinates.map((coords, i) => ({
      coords,
      damage: calculateDamage(coords, grid),
      key: `ship-${i}-${coords.join(',')}`,
    }));
  }, [shipCoordinates, grid]);

  return (
    <group>
      {ships.map((ship) => (
        <ShipFactory
          key={ship.key}
          coordinates={ship.coords}
          damage={ship.damage}
          showWake={true}
        />
      ))}
      {previewCoords && previewCoords.length > 0 && (
        <ShipFactory
          key={`preview-${previewCoords.join(',')}`}
          coordinates={previewCoords}
          isPreview={true}
        />
      )}
    </group>
  );
}
