import type { Difficulty } from '../services/api';

export const BOARD_SIZE = 10;
export const HALF_BOARD = BOARD_SIZE / 2;

export const SHIPS_TO_PLACE = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
] as const;

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#22c55e',
  medium: '#fbbf24',
  hard: '#ef4444',
};
