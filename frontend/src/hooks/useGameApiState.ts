import { useState, useCallback, useMemo } from 'react';
import * as api from '../services/api';
import type { GameStateResponse, Difficulty } from '../services/api';

export function useGameApiState() {
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');

  const clearError = useCallback(() => setError(null), []);

  const startGame = useCallback(async (diff?: Difficulty) => {
    const selectedDifficulty = diff ?? difficulty;
    setLoading(true);
    setError(null);
    try {
      const { game_id } = await api.startGame(selectedDifficulty);
      setDifficulty(selectedDifficulty);
      setGameId(game_id);
      setGameState(null);
      return game_id;
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
    shipPlacements: api.ShipPlacement[]
  ): Promise<GameStateResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const state = await api.placeShips(gId, shipPlacements);
      setGameState(state);
      return state;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place ships';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fireShot = useCallback(async (gId: string, coordinate: string) => {
    setError(null);
    try {
      const response = await api.fireShot(gId, coordinate);
      return response;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fire shot';
      setError(msg);
      return null;
    }
  }, []);

  const refreshState = useCallback(async (gId: string) => {
    try {
      const state = await api.getGameState(gId);
      setGameState(state);
      return state;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get game state';
      setError(msg);
      return null;
    }
  }, []);

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
    gameId,
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
  };
}
