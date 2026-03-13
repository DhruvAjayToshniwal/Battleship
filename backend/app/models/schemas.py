from typing import Optional

from pydantic import BaseModel


class ShipPlacement(BaseModel):
	name: str
	coordinates: list[str]


class PlaceShipsRequest(BaseModel):
	game_id: str
	ships: list[ShipPlacement]


class FireRequest(BaseModel):
	game_id: str
	coordinate: str


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


class StartGameRequest(BaseModel):
	difficulty: str = "hard"


class StartGameResponse(BaseModel):
	game_id: str
	difficulty: str = "hard"
	message: str = "Game created. Place your ships to begin."


class ErrorResponse(BaseModel):
	detail: str
