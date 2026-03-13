import { useCallback, useMemo } from 'react';
import { useGameApiState } from './useGameApiState';
import { useShipPlacement } from './useShipPlacement';
import { useBattleSequence } from './useBattleSequence';
import { useAudioDirector } from './useAudioDirector';
import { coordToRowCol } from '../utils/coordinates';
import { buildGridFromState } from '../utils/boardState';
import type { Difficulty } from '../services/api';

export type { Phase } from './useBattleSequence';
export type { Orientation, PlacedShip } from './useShipPlacement';

export function useGame() {
  const apiState = useGameApiState();
  const placement = useShipPlacement();
  const audio = useAudioDirector();

  const battle = useBattleSequence({
    audio,
    onFireShot: apiState.fireShot,
    onRefreshState: apiState.refreshState,
    firedCoords: apiState.firedCoords,
  });

  const startGame = useCallback(async (diff?: Difficulty) => {
    const gameId = await apiState.startGame(diff);
    if (gameId) {
      placement.reset();
      battle.resetBattle();
      audio.playGameStart();
    }
  }, [apiState, placement, battle, audio]);

  const confirmPlacement = useCallback(async () => {
    if (!apiState.gameId || !placement.allShipsPlaced) return;
    const shipPlacements = placement.placedShips.map((s) => ({
      name: s.name,
      coordinates: s.coordinates,
    }));
    const state = await apiState.placeShips(apiState.gameId, shipPlacements);
    if (state) {
      battle.startBattle();
    }
  }, [apiState, placement, battle]);

  const fireShot = useCallback(
    async (coordinate: string) => {
      if (!apiState.gameId) return;
      await battle.fireShot(apiState.gameId, coordinate);
    },
    [apiState.gameId, battle]
  );

  const placeShipAt = useCallback(
    (row: number, col: number): boolean => {
      const placed = placement.placeShipAt(row, col);
      if (placed) audio.playShipPlace();
      return placed;
    },
    [placement, audio]
  );

  const localPlayerGrid = useMemo((): (string | null)[][] => {
    if (battle.phase !== 'setup') {
      return buildGridFromState(apiState.gameState, 'player');
    }
    const grid: (string | null)[][] = Array.from({ length: 10 }, () =>
      Array(10).fill(null)
    );
    for (const ship of placement.placedShips) {
      for (const coord of ship.coordinates) {
        const [r, c] = coordToRowCol(coord);
        grid[r][c] = 'ship';
      }
    }
    return grid;
  }, [battle.phase, apiState.gameState, placement.placedShips]);

  const aiGrid = useMemo(
    () => buildGridFromState(apiState.gameState, 'ai'),
    [apiState.gameState]
  );

  return {
    gameState: apiState.gameState,
    loading: apiState.loading,
    error: apiState.error,
    difficulty: apiState.difficulty,
    clearError: apiState.clearError,
    changeDifficulty: apiState.changeDifficulty,

    orientation: placement.orientation,
    placedShips: placement.placedShips,
    currentShip: placement.currentShip,
    currentShipIndex: placement.currentShipIndex,
    allShipsPlaced: placement.allShipsPlaced,
    shipsToPlace: placement.shipsToPlace,
    getShipPreview: placement.getShipPreview,
    undoLastShip: placement.undoLastShip,
    autoPlace: placement.autoPlace,

    phase: battle.phase,
    isPlayerTurn: battle.isPlayerTurn,
    isFiring: battle.isFiring,
    lastPlayerResult: battle.lastPlayerResult,
    lastAiResult: battle.lastAiResult,
    message: battle.message,

    localPlayerGrid,
    aiGrid,

    startGame,
    placeShipAt,
    confirmPlacement,
    fireShot,
  };
}
