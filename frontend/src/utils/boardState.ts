import type { GameStateResponse } from '../services/api';
import { coordToRowCol } from './coordinates';

export function buildGridFromState(
  gameState: GameStateResponse | null,
  board: 'player' | 'ai',
  boardSize: number = 10
): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: boardSize }, () =>
    Array(boardSize).fill(null)
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
