import { useState, useCallback, useMemo } from 'react';
import * as api from '../services/api';
import type { GameStateResponse, Difficulty } from '../services/api';

export type GameMode = 'ai' | 'human';

interface UseGameApiStateOptions {
  mode?: GameMode;
  roomId?: string | null;
  playerToken?: string | null;
  playerName?: string;
}

export function useGameApiState(options: UseGameApiStateOptions = {}) {
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [gameId, setGameId] = useState<string | null>(options.roomId ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');

  const mode = options.mode ?? 'ai';
  const token = options.playerToken ?? null;
  const playerName = options.playerName ?? 'Player';

  const clearError = useCallback(() => setError(null), []);

  const startGame = useCallback(async (diff?: Difficulty) => {
    const selectedDifficulty = diff ?? difficulty;
    setLoading(true);
    setError(null);
    try {
      const result = await api.createRoom('ai', playerName, selectedDifficulty);
      setDifficulty(selectedDifficulty);
      setGameId(result.room_id);
      setGameState(null);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start game';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  const placeShips = useCallback(async (
    gId: string,
    shipPlacements: api.ShipPlacement[],
    playerToken?: string
  ): Promise<GameStateResponse | api.PlacementResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const tkn = playerToken ?? token;
      if (!tkn) throw new Error('No authentication token');
      const result = await api.placeShipsAuth(gId, tkn, shipPlacements);
      if ('player_board' in result) {
        setGameState(result as GameStateResponse);
      }
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place ships';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fireShot = useCallback(async (gId: string, coordinate: string, playerToken?: string) => {
    setError(null);
    try {
      const tkn = playerToken ?? token;
      if (!tkn) throw new Error('No authentication token');
      const response = await api.fireShotAuth(gId, tkn, coordinate);
      return response;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fire shot';
      setError(msg);
      return null;
    }
  }, [token]);

  const refreshState = useCallback(async (gId: string, playerToken?: string) => {
    try {
      const tkn = playerToken ?? token;
      if (!tkn) throw new Error('No authentication token');
      const state = await api.getGameStateAuth(gId, tkn);
      if ('player_board' in state) {
        setGameState(state as GameStateResponse);
      }
      return state;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get game state';
      setError(msg);
      return null;
    }
  }, [token]);

  const firedCoords = useMemo(() => {
    if (!gameState) return new Set<string>();
    return new Set([
      ...gameState.ai_board.hits,
      ...gameState.ai_board.misses,
    ]);
  }, [gameState]);

  const changeDifficulty = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
  }, []);

  return {
    gameState,
    setGameState,
    gameId,
    setGameId,
    loading,
    error,
    difficulty,
    firedCoords,
    clearError,
    startGame,
    placeShips,
    fireShot,
    refreshState,
    changeDifficulty,
    mode,
    token,
  };
}
