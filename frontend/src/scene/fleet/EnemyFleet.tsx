import { useMemo } from 'react';
import ShipFactory from './ShipFactory';
import { coordToRowCol } from '../../utils/coordinates';

interface EnemyFleetProps {
  shipCoordinates: string[][];
  grid: (string | null)[][];
}

function isShipSunk(coords: string[], grid: (string | null)[][]): boolean {
  return coords.every((coord) => {
    const [row, col] = coordToRowCol(coord);
    if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
      return grid[row][col] === 'hit';
    }
    return false;
  });
}

export default function EnemyFleet({ shipCoordinates, grid }: EnemyFleetProps) {
  const sunkShips = useMemo(() => {
    return shipCoordinates
      .filter((coords) => coords.length > 0 && isShipSunk(coords, grid))
      .map((coords, i) => ({
        coords,
        key: `sunk-${i}-${coords.join(',')}`,
      }));
  }, [shipCoordinates, grid]);

  return (
    <group>
      {sunkShips.map((ship) => (
        <ShipFactory
          key={ship.key}
          coordinates={ship.coords}
          damage={1}
          showWake={false}
        />
      ))}
    </group>
  );
}
