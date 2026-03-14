import { useState, useCallback, useEffect } from 'react';
import { rowColToCoord } from '../utils/coordinates';
import { SHIPS_TO_PLACE } from '../utils/constants';

export type Orientation = 'h' | 'v';

export interface PlacedShip {
  name: string;
  size: number;
  coordinates: string[];
}

export function useShipPlacement(boardSize: number = 10) {
  const [orientation, setOrientation] = useState<Orientation>('h');
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);

  const shipsToPlace = SHIPS_TO_PLACE;
  const currentShip =
    currentShipIndex < shipsToPlace.length ? shipsToPlace[currentShipIndex] : null;
  const allShipsPlaced = currentShipIndex >= shipsToPlace.length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setOrientation((o) => (o === 'h' ? 'v' : 'h'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const getShipPreview = useCallback(
    (row: number, col: number): string[] | null => {
      if (!currentShip) return null;
      const coords: string[] = [];
      for (let i = 0; i < currentShip.size; i++) {
        const r = orientation === 'v' ? row + i : row;
        const c = orientation === 'h' ? col + i : col;
        if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) return null;
        coords.push(rowColToCoord(r, c));
      }
      const allPlacedCoords = new Set(placedShips.flatMap((s) => s.coordinates));
      for (const coord of coords) {
        if (allPlacedCoords.has(coord)) return null;
      }
      return coords;
    },
    [currentShip, orientation, placedShips]
  );

  const placeShipAt = useCallback(
    (row: number, col: number): boolean => {
      const coords = getShipPreview(row, col);
      if (!coords || !currentShip) return false;
      setPlacedShips((prev) => [
        ...prev,
        { name: currentShip.name, size: currentShip.size, coordinates: coords },
      ]);
      setCurrentShipIndex((i) => i + 1);
      return true;
    },
    [getShipPreview, currentShip]
  );

  const undoLastShip = useCallback(() => {
    if (placedShips.length === 0) return;
    setPlacedShips((prev) => prev.slice(0, -1));
    setCurrentShipIndex((i) => i - 1);
  }, [placedShips.length]);

  const autoPlace = useCallback(() => {
    const ships = [...shipsToPlace];
    const placed: PlacedShip[] = [];
    const occupied = new Set<string>();

    for (const ship of ships) {
      let attempts = 0;
      while (attempts < 1000) {
        const o: Orientation = Math.random() < 0.5 ? 'h' : 'v';
        const maxRow = o === 'v' ? boardSize - ship.size : boardSize - 1;
        const maxCol = o === 'h' ? boardSize - ship.size : boardSize - 1;
        const row = Math.floor(Math.random() * (maxRow + 1));
        const col = Math.floor(Math.random() * (maxCol + 1));
        const coords: string[] = [];
        let valid = true;
        for (let i = 0; i < ship.size; i++) {
          const r = o === 'v' ? row + i : row;
          const c = o === 'h' ? col + i : col;
          const coord = rowColToCoord(r, c);
          if (occupied.has(coord)) {
            valid = false;
            break;
          }
          coords.push(coord);
        }
        if (valid) {
          coords.forEach((c) => occupied.add(c));
          placed.push({ name: ship.name, size: ship.size, coordinates: coords });
          break;
        }
        attempts++;
      }
    }
    setPlacedShips(placed);
    setCurrentShipIndex(ships.length);
  }, [shipsToPlace]);

  const reset = useCallback(() => {
    setPlacedShips([]);
    setCurrentShipIndex(0);
  }, []);

  return {
    orientation,
    placedShips,
    currentShipIndex,
    currentShip,
    allShipsPlaced,
    shipsToPlace,
    getShipPreview,
    placeShipAt,
    undoLastShip,
    autoPlace,
    reset,
  };
}
