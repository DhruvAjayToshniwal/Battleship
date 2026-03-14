import axios from 'axios';
import { getClientId } from './identity';

const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  try {
    config.headers['X-Client-Id'] = getClientId();
  } catch (e) {
    console.error('Failed to attach client ID:', e);
  }
  return config;
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

export interface CreateRoomResponse {
  room_id: string;
  room_code: string;
  player_id: string;
  client_token: string;
  mode: string;
  difficulty: string | null;
}

export interface JoinRoomResponse {
  room_id: string;
  room_code: string;
  player_id: string;
  client_token: string;
  player_slot: string;
}

export interface PlayerInfo {
  player_id: string;
  player_slot: string;
  display_name: string;
  connected: boolean;
}

export interface ReconnectResponse {
  room_id: string;
  room_code: string;
  player_id: string;
  player_slot: string;
  client_token: string;
  room_status: string;
  mode: string;
  players: PlayerInfo[];
}

export interface MultiplayerGameState {
  game_id: string;
  game_status: string;
  player_slot: string;
  your_turn: boolean;
  turn_number: number;
  player_board: PlayerBoardState;
  opponent_board: AIBoardState;
  my_shots: ShotResult[];
  opponent_shots: ShotResult[];
  my_ships_remaining: number;
  opponent_ships_remaining: number;
}

export interface MultiplayerShotResult {
  shot: ShotResult;
  game_status: string;
  turn_number: number;
  next_turn: string | null;
  actor_player_id: string;
  actor_slot: string;
}

export interface PlacementResult {
  placement_complete: boolean;
  game_status: string;
  player_slot: string;
}

export interface GameHistorySummary {
  room_id: string;
  room_code: string;
  mode: string;
  status: string;
  winner_name: string | null;
  winner_player_id: string | null;
  move_count: number;
  duration_seconds: number | null;
  created_at: string | null;
  players: Array<{ player_id: string; player_slot: string; display_name: string }>;
}


export async function createRoom(
  mode: string = 'human',
  displayName: string = 'Player',
  difficulty: Difficulty = 'hard'
): Promise<CreateRoomResponse> {
  const response = await api.post('/rooms', {
    mode,
    display_name: displayName,
    difficulty,
    client_id: getClientId(),
  });
  return response.data;
}

export async function joinRoom(
  roomCode: string,
  displayName: string = 'Player'
): Promise<JoinRoomResponse> {
  const response = await api.post('/rooms/join', {
    room_code: roomCode,
    display_name: displayName,
    client_id: getClientId(),
  });
  return response.data;
}

export async function reconnectRoom(): Promise<ReconnectResponse> {
  const response = await api.post('/rooms/reconnect');
  return response.data;
}

export async function placeShipsAuth(
  roomId: string,
  token: string,
  ships: ShipPlacement[]
): Promise<PlacementResult | GameStateResponse> {
  const response = await api.post(`/rooms/${roomId}/place-ships`, {
    client_token: token,
    ships,
  });
  return response.data;
}

export async function fireShotAuth(
  roomId: string,
  token: string,
  coordinate: string
): Promise<TurnResult | MultiplayerShotResult> {
  const response = await api.post(`/rooms/${roomId}/fire`, {
    client_token: token,
    coordinate,
  });
  return response.data;
}

export async function getGameStateAuth(
  roomId: string,
  token: string
): Promise<GameStateResponse | MultiplayerGameState> {
  const response = await api.get(`/rooms/${roomId}/state`, {
    headers: { 'X-Client-Token': token },
  });
  return response.data;
}

export async function getHistory(
  limit: number = 20,
  offset: number = 0
): Promise<{ games: GameHistorySummary[] }> {
  const response = await api.get('/games/history', {
    params: { limit, offset },
  });
  return response.data;
}

export interface PlayerStats {
  client_id: string;
  display_name: string;
  wins: number;
  losses: number;
  games_played: number;
  total_shots: number;
  total_hits: number;
  hit_rate: number;
  created_at: string;
}

export async function getPlayerStats(): Promise<PlayerStats | null> {
  try {
    const response = await api.get('/players/me/stats');
    return response.data;
  } catch {
    return null;
  }
}

