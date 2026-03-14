from typing import Optional

from pydantic import BaseModel


class ShipPlacement(BaseModel):
	name: str
	coordinates: list[str]


class ShotResult(BaseModel):
	result: str
	ship: Optional[str] = None
	coordinate: str
	sunk_ship_coords: Optional[list[str]] = None


class TurnResult(BaseModel):
	player_shot: ShotResult
	ai_shot: Optional[ShotResult] = None
	game_status: str


class ShipState(BaseModel):
	name: str
	coordinates: list[str]
	hits: list[str]
	sunk: bool


class PlayerBoardState(BaseModel):
	ships: list[ShipState]
	shots_received: list[str]


class AIBoardState(BaseModel):
	ships: list[ShipState]
	hits: list[str]
	misses: list[str]


class GameStateResponse(BaseModel):
	game_id: str
	game_status: str
	player_board: PlayerBoardState
	ai_board: AIBoardState
	player_shots: list[ShotResult]
	ai_shots: list[ShotResult]
	player_ships_remaining: int
	ai_ships_remaining: int


class ErrorResponse(BaseModel):
	detail: str


class CreateRoomRequest(BaseModel):
	mode: str = "human"
	display_name: str = "Player"
	difficulty: str = "hard"
	client_id: Optional[str] = None


class CreateRoomResponse(BaseModel):
	room_id: str
	room_code: str
	player_id: str
	client_token: str
	mode: str
	difficulty: Optional[str] = None


class JoinRoomRequest(BaseModel):
	room_code: str
	display_name: str = "Player"
	client_id: Optional[str] = None


class JoinRoomResponse(BaseModel):
	room_id: str
	room_code: str
	player_id: str
	client_token: str
	player_slot: str


class PlayerInfo(BaseModel):
	player_id: str
	player_slot: str
	display_name: str
	connected: bool


class ReconnectResponse(BaseModel):
	room_id: str
	room_code: str
	player_id: str
	player_slot: str
	client_token: str
	room_status: str
	mode: str
	players: list[PlayerInfo]


class PlaceShipsAuthRequest(BaseModel):
	client_token: str
	ships: list[ShipPlacement]


class FireAuthRequest(BaseModel):
	client_token: str
	coordinate: str


class PlacementResponse(BaseModel):
	placement_complete: bool
	game_status: str
	player_slot: str


class MultiplayerShotResponse(BaseModel):
	shot: ShotResult
	game_status: str
	turn_number: int
	next_turn: Optional[str] = None
	actor_player_id: str
	actor_slot: str


class GameHistorySummary(BaseModel):
	room_id: str
	room_code: str
	mode: str
	status: str
	winner_name: Optional[str] = None
	winner_player_id: Optional[str] = None
	move_count: int
	duration_seconds: Optional[int] = None
	created_at: Optional[str] = None
	players: list[dict]


class GameHistoryListResponse(BaseModel):
	games: list[GameHistorySummary]


class PlayerStatsResponse(BaseModel):
	client_id: str
	display_name: str
	wins: int
	losses: int
	games_played: int
	total_shots: int
	total_hits: int
	hit_rate: float
	created_at: Optional[str] = None


class WsEvent(BaseModel):
	type: str
	data: dict = {}
