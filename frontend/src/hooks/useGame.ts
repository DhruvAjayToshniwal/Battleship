import { useState, useCallback, useEffect, useMemo } from 'react';
import * as api from '../services/api';
import type { GameStateResponse, ShotResult, Difficulty } from '../services/api';
import {
  playMissileLaunch,
  playExplosion,
  playSplash,
  playShipPlace,
  playShipSunk,
  playGameStart,
  playVictory,
  playDefeat,
  playTurnStart,
  playEnemyFire,
} from './useSound';

export type Phase = 'setup' | 'playing' | 'gameOver';
export type Orientation = 'h' | 'v';

export interface PlacedShip {
  name: string;
  size: number;
  coordinates: string[];
}

function coordToRowCol(coord: string): [number, number] {
  const col = coord.charCodeAt(0) - 65;
  const row = parseInt(coord.slice(1), 10) - 1;
  return [row, col];
}

function rowColToCoord(row: number, col: number): string {
  return String.fromCharCode(65 + col) + (row + 1);
}

function buildGridFromState(
  gameState: GameStateResponse | null,
  board: 'player' | 'ai'
): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: 10 }, () =>
    Array(10).fill(null)
  );
  if (!gameState) return grid;

  if (board === 'player') {
    const pb = gameState.player_board;
    for (const ship of pb.ships) {
      for (const coord of ship.coordinates) {
        const [r, c] = coordToRowCol(coord);
        grid[r][c] = 'ship';
      }
      for (const coord of ship.hits) {
        const [r, c] = coordToRowCol(coord);
        grid[r][c] = 'hit';
      }
    }
    for (const coord of pb.shots_received) {
      const [r, c] = coordToRowCol(coord);
      if (grid[r][c] !== 'hit') {
        grid[r][c] = grid[r][c] === 'ship' ? 'hit' : 'miss';
      }
    }
  } else {
    const ab = gameState.ai_board;
    for (const coord of ab.hits) {
      const [r, c] = coordToRowCol(coord);
      grid[r][c] = 'hit';
    }
    for (const coord of ab.misses) {
      const [r, c] = coordToRowCol(coord);
      grid[r][c] = 'miss';
    }
    for (const ship of ab.ships) {
      for (const coord of ship.coordinates) {
        const [r, c] = coordToRowCol(coord);
        if (grid[r][c] !== 'hit') grid[r][c] = 'ship';
      }
    }
  }
  return grid;
}

const SHIPS_TO_PLACE = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
];

export function useGame() {
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [orientation, setOrientation] = useState<Orientation>('h');
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [lastPlayerResult, setLastPlayerResult] = useState<ShotResult | null>(
    null
  );
  const [lastAiResult, setLastAiResult] = useState<ShotResult | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isFiring, setIsFiring] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [message, setMessage] = useState<string>('Deploy your fleet, Commander.');

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

  const startGame = useCallback(async (diff?: Difficulty) => {
    const selectedDifficulty = diff ?? difficulty;
    setLoading(true);
    setError(null);
    try {
      const { game_id } = await api.startGame(selectedDifficulty);
      setDifficulty(selectedDifficulty);
      setGameId(game_id);
      setGameState(null);
      setPhase('setup');
      setPlacedShips([]);
      setCurrentShipIndex(0);
      setLastPlayerResult(null);
      setLastAiResult(null);
      setIsPlayerTurn(true);
      setMessage('Deploy your fleet, Commander.');
      playGameStart();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start game';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  const getShipPreview = useCallback(
    (row: number, col: number): string[] | null => {
      if (!currentShip) return null;
      const coords: string[] = [];
      for (let i = 0; i < currentShip.size; i++) {
        const r = orientation === 'v' ? row + i : row;
        const c = orientation === 'h' ? col + i : col;
        if (r < 0 || r >= 10 || c < 0 || c >= 10) return null;
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
      playShipPlace();
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
        const maxRow = o === 'v' ? 10 - ship.size : 9;
        const maxCol = o === 'h' ? 10 - ship.size : 9;
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

  const confirmPlacement = useCallback(async () => {
    if (!gameId || !allShipsPlaced) return;
    setLoading(true);
    setError(null);
    try {
      const shipPlacements = placedShips.map((s) => ({
        name: s.name,
        coordinates: s.coordinates,
      }));
      const state = await api.placeShips(gameId, shipPlacements);
      setGameState(state);
      setPhase('playing');
      setMessage('All ships deployed. Open fire, Commander!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place ships';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [gameId, allShipsPlaced, placedShips]);

  const firedCoords = useMemo(() => {
    if (!gameState) return new Set<string>();
    return new Set([
      ...gameState.ai_board.hits,
      ...gameState.ai_board.misses,
    ]);
  }, [gameState]);

  const fireShot = useCallback(
    async (coordinate: string) => {
      if (!gameId || phase !== 'playing' || !isPlayerTurn || isFiring) return;
      if (firedCoords.has(coordinate)) return;

      setIsFiring(true);
      setIsPlayerTurn(false);
      setMessage('Firing...');
      playMissileLaunch();

      try {
        const response = await api.fireShot(gameId, coordinate);
        const playerShot = response.player_shot;
        setLastPlayerResult(playerShot);

        if (playerShot.result === 'hit' || playerShot.result === 'sunk') {
          const shipName = playerShot.ship;
          if (playerShot.result === 'sunk') {
            setMessage(`Direct hit! ${shipName} sunk!`);
            playShipSunk();
          } else {
            setMessage(`Hit! ${shipName ? shipName + ' damaged!' : ''}`);
            playExplosion();
          }
        } else {
          setMessage('Miss. Splash.');
          playSplash();
        }

        await new Promise((r) => setTimeout(r, 1200));

        if (response.ai_shot) {
          setMessage('Enemy is firing...');
          playEnemyFire();
          await new Promise((r) => setTimeout(r, 800));

          setLastAiResult(response.ai_shot);

          if (
            response.ai_shot.result === 'hit' ||
            response.ai_shot.result === 'sunk'
          ) {
            if (response.ai_shot.result === 'sunk') {
              setMessage(`Enemy sunk our ${response.ai_shot.ship}!`);
              playShipSunk();
            } else {
              setMessage(`Enemy hit our ${response.ai_shot.ship || 'ship'}!`);
              playExplosion();
            }
          } else {
            setMessage('Enemy missed!');
            playSplash();
          }
        }

        const updatedState = await api.getGameState(gameId);
        setGameState(updatedState);

        if (
          updatedState.game_status === 'player_wins' ||
          response.game_status === 'player_wins'
        ) {
          setPhase('gameOver');
          setMessage('VICTORY! All enemy ships destroyed!');
          playVictory();
        } else if (
          updatedState.game_status === 'ai_wins' ||
          response.game_status === 'ai_wins'
        ) {
          setPhase('gameOver');
          setMessage('DEFEAT. Our fleet has been destroyed.');
          playDefeat();
        } else {
          await new Promise((r) => setTimeout(r, 800));
          setIsPlayerTurn(true);
          setMessage('Your turn, Commander.');
          playTurnStart();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fire shot';
        setError(msg);
        setIsPlayerTurn(true);
      } finally {
        setIsFiring(false);
      }
    },
    [gameId, phase, isPlayerTurn, isFiring, firedCoords]
  );

  const changeDifficulty = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
  }, []);

  const localPlayerGrid = useMemo((): (string | null)[][] => {
    if (phase !== 'setup') {
      return buildGridFromState(gameState, 'player');
    }
    const grid: (string | null)[][] = Array.from({ length: 10 }, () =>
      Array(10).fill(null)
    );
    for (const ship of placedShips) {
      for (const coord of ship.coordinates) {
        const [r, c] = coordToRowCol(coord);
        grid[r][c] = 'ship';
      }
    }
    return grid;
  }, [phase, gameState, placedShips]);

  const aiGrid = useMemo(
    () => buildGridFromState(gameState, 'ai'),
    [gameState]
  );

  return {
    gameState,
    loading,
    error,
    phase,
    orientation,
    placedShips,
    currentShip,
    currentShipIndex,
    allShipsPlaced,
    shipsToPlace,
    localPlayerGrid,
    aiGrid,
    lastPlayerResult,
    lastAiResult,
    isPlayerTurn,
    isFiring,
    message,
    startGame,
    getShipPreview,
    placeShipAt,
    undoLastShip,
    autoPlace,
    confirmPlacement,
    fireShot,
    difficulty,
    changeDifficulty,
  };
}
