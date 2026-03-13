import axios from 'axios';

const api = axios.create({
  baseURL: '/game',
});

export interface ShipPlacement {
  name: string;
  coordinates: string[];
}

export interface ShotResult {
  result: 'hit' | 'miss' | 'sunk';
  ship: string | null;
  coordinate: string;
  sunk_ship_coords: string[] | null;
}

export interface ShipState {
  name: string;
  coordinates: string[];
  hits: string[];
  sunk: boolean;
}

export interface PlayerBoardState {
  ships: ShipState[];
  shots_received: string[];
}

export interface AIBoardState {
  ships: ShipState[];
  hits: string[];
  misses: string[];
}

export interface GameStateResponse {
  game_id: string;
  game_status: 'setup' | 'playing' | 'player_wins' | 'ai_wins';
  player_board: PlayerBoardState;
  ai_board: AIBoardState;
  player_shots: ShotResult[];
  ai_shots: ShotResult[];
  player_ships_remaining: number;
  ai_ships_remaining: number;
}

export interface TurnResult {
  player_shot: ShotResult;
  ai_shot: ShotResult | null;
  game_status: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface StartGameResponse {
  game_id: string;
  difficulty: Difficulty;
  message: string;
}

export async function startGame(difficulty: Difficulty = 'hard'): Promise<StartGameResponse> {
  const response = await api.post('/start', { difficulty });
  return response.data;
}

export async function placeShips(
  gameId: string,
  ships: ShipPlacement[]
): Promise<GameStateResponse> {
  const response = await api.post('/place-ships', {
    game_id: gameId,
    ships,
  });
  return response.data;
}

export async function fireShot(
  gameId: string,
  coordinate: string
): Promise<TurnResult> {
  const response = await api.post('/fire', {
    game_id: gameId,
    coordinate,
  });
  return response.data;
}

export async function getGameState(gameId: string): Promise<GameStateResponse> {
  const response = await api.get('/state', {
    params: { game_id: gameId },
  });
  return response.data;
}
