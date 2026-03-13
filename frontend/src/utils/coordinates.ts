import { HALF_BOARD } from './constants';

export function coordToRowCol(coord: string): [number, number] {
  const col = coord.charCodeAt(0) - 65;
  const row = parseInt(coord.slice(1), 10) - 1;
  return [row, col];
}

export function rowColToCoord(row: number, col: number): string {
  return String.fromCharCode(65 + col) + (row + 1);
}

export function coordToPosition(coord: string): [number, number, number] {
  const [row, col] = coordToRowCol(coord);
  return [col - HALF_BOARD + 0.5, 0.1, row - HALF_BOARD + 0.5];
}

export function coordToXZ(coord: string): [number, number] {
  const [row, col] = coordToRowCol(coord);
  return [col - HALF_BOARD + 0.5, row - HALF_BOARD + 0.5];
}
