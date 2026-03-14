import { useCallback, useMemo } from 'react';
import { useGameApiState } from './useGameApiState';
import { useShipPlacement } from './useShipPlacement';
import { useBattleSequence } from './useBattleSequence';
import { useAudioDirector } from './useAudioDirector';
import { coordToRowCol } from '../utils/coordinates';
import { buildGridFromState } from '../utils/boardState';
import type { Difficulty } from '../services/api';
import { markInGame, clearSession } from '../services/session';

export type { Phase } from './useBattleSequence';
export type { Orientation, PlacedShip } from './useShipPlacement';
export type { GameMode } from './useGameApiState';

interface UseGameOptions {
  mode?: 'ai' | 'human';
  roomId?: string | null;
  playerToken?: string | null;
  playerId?: string | null;
  playerName?: string;
  boardSize?: number;
}

export function useGame(options: UseGameOptions = {}) {
  const mode = options.mode ?? 'ai';

  const boardSize = options.boardSize ?? 10;

  const apiState = useGameApiState({
    mode,
    roomId: options.roomId,
    playerToken: options.playerToken,
    playerName: options.playerName,
    boardSize,
  });
  const placement = useShipPlacement(boardSize);
  const audio = useAudioDirector();

  const battle = useBattleSequence({
    audio,
    onFireShot: (gameId, coordinate) =>
      apiState.fireShot(gameId, coordinate, options.playerToken ?? undefined),
    onRefreshState: (gameId) =>
      apiState.refreshState(gameId, options.playerToken ?? undefined),
    firedCoords: apiState.firedCoords,
    mode,
  });

  const startGame = useCallback(async (diff?: Difficulty) => {
    try {
      const result = await apiState.startGame(diff);
      if (result) {
        placement.reset();
        battle.resetBattle();
        audio.playGameStart();

        markInGame();

        return result;
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [apiState, placement, battle, audio]);

  const restoreGame = useCallback(async (restoredRoomId: string, restoredToken: string) => {
    try {
      apiState.setGameId(restoredRoomId);
      const state = await apiState.refreshState(restoredRoomId, restoredToken);
      if (state && 'game_status' in state) {
        const status = (state as { game_status: string }).game_status;
        if (status === 'playing') {
          battle.startBattle();
        } else if (status === 'player_wins' || status === 'ai_wins') {
          battle.receiveGameUpdate(status, false);
        } else if (status === 'setup') {
          placement.reset();
          battle.setPhase('setup');
        }
        return state;
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [apiState, battle, placement]);

  const confirmPlacement = useCallback(async () => {
    try {
      const gId = options.roomId ?? apiState.gameId;
      const tkn = options.playerToken ?? apiState.token;
      if (!gId || !placement.allShipsPlaced || !tkn) return;

      const shipPlacements = placement.placedShips.map((s) => ({
        name: s.name,
        coordinates: s.coordinates,
      }));

      const result = await apiState.placeShips(gId, shipPlacements, tkn);
      if (result) {
        if (mode === 'ai') {
          battle.startBattle();
        } else {
          if ('placement_complete' in result && result.placement_complete) {
            battle.startBattle();
          } else {
            battle.setPhase('setup');
            battle.setMessage('Ships deployed. Waiting for opponent...');
          }
        }
      }
    } catch (e) {
      console.error('Placement error:', e);
    }
  }, [apiState, placement, battle, mode, options.roomId, options.playerToken]);

  const fireShot = useCallback(
    async (coordinate: string) => {
      try {
        const gId = options.roomId ?? apiState.gameId;
        if (!gId) return;
        await battle.fireShot(gId, coordinate);
      } catch (e) {
        console.error('Fire error:', e);
      }
    },
    [apiState.gameId, battle, options.roomId]
  );

  const placeShipAt = useCallback(
    (row: number, col: number): boolean => {
      try {
        const placed = placement.placeShipAt(row, col);
        if (placed) audio.playShipPlace();
        return placed;
      } catch (e) {
        return false;
      }
    },
    [placement, audio]
  );

  const localPlayerGrid = useMemo((): (string | null)[][] => {
    if (battle.phase !== 'setup') {
      return buildGridFromState(apiState.gameState, 'player', boardSize);
    }
    const grid: (string | null)[][] = Array.from({ length: boardSize }, () =>
      Array(boardSize).fill(null)
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
    () => buildGridFromState(apiState.gameState, 'ai', boardSize),
    [apiState.gameState, boardSize]
  );

  const leaveGame = useCallback(() => {
    clearSession();
  }, []);

  return {
    gameState: apiState.gameState,
    setGameState: apiState.setGameState,
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
    setPhase: battle.setPhase,
    isPlayerTurn: battle.isPlayerTurn,
    setIsPlayerTurn: battle.setIsPlayerTurn,
    isFiring: battle.isFiring,
    lastPlayerResult: battle.lastPlayerResult,
    lastAiResult: battle.lastAiResult,
    message: battle.message,
    setMessage: battle.setMessage,
    receiveOpponentShot: battle.receiveOpponentShot,
    receiveGameUpdate: battle.receiveGameUpdate,
    startBattle: battle.startBattle,
    resetBattle: battle.resetBattle,

    localPlayerGrid,
    aiGrid,
    mode,
    boardSize,

    startGame,
    restoreGame,
    placeShipAt,
    confirmPlacement,
    fireShot,
    leaveGame,
    refreshState: apiState.refreshState,
  };
}
