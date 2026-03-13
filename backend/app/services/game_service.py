import uuid
from typing import Optional

from app.engine.game_engine import GameEngine
from app.models.schemas import (
	FireRequest,
	GameStateResponse,
	PlaceShipsRequest,
	ShotResult,
	StartGameRequest,
	StartGameResponse,
	TurnResult,
)


class GameService:
	instance: Optional["GameService"] = None
	games: dict[str, GameEngine] = {}

	def __new__(cls) -> "GameService":
		if cls.instance is None:
			cls.instance = super().__new__(cls)
			cls.instance.games = {}
		return cls.instance

	@classmethod
	def get_instance(cls) -> "GameService":
		if cls.instance is None:
			cls.instance = cls()
		return cls.instance

	@classmethod
	def reset(cls) -> None:
		cls.instance = None
		cls.games = {}

	def get_engine(self, game_id: str) -> GameEngine:
		engine = self.games.get(game_id)
		if engine is None:
			raise ValueError(f"Game {game_id} not found")
		return engine

	async def start_game(self, difficulty: str = "hard") -> StartGameResponse:
		try:
			if difficulty not in ("easy", "medium", "hard"):
				raise ValueError(
					f"Invalid difficulty: {difficulty}. Must be easy, medium, or hard."
				)
			game_id = str(uuid.uuid4())
			engine = GameEngine(difficulty=difficulty)
			engine.setup_ai()
			self.games[game_id] = engine
			return StartGameResponse(game_id=game_id, difficulty=difficulty)
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to start game: {e}") from e

	async def place_ships(self, request: PlaceShipsRequest) -> GameStateResponse:
		try:
			engine = self.get_engine(request.game_id)
			placements = [
				{"name": s.name, "coordinates": s.coordinates} for s in request.ships
			]
			engine.place_player_ships(placements)
			return self.build_state_response(request.game_id, engine)
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to place ships: {e}") from e

	async def fire(self, request: FireRequest) -> TurnResult:
		try:
			engine = self.get_engine(request.game_id)

			player_result = engine.fire_shot(request.coordinate)
			player_shot = ShotResult(
				result=player_result["result"],
				ship=player_result["ship"],
				coordinate=player_result["coordinate"],
				sunk_ship_coords=player_result["sunk_ship_coords"],
			)

			ai_shot: Optional[ShotResult] = None
			if engine.game_status == "playing":
				ai_result = engine.ai_turn()
				ai_shot = ShotResult(
					result=ai_result["result"],
					ship=ai_result["ship"],
					coordinate=ai_result["coordinate"],
					sunk_ship_coords=ai_result["sunk_ship_coords"],
				)

			return TurnResult(
				player_shot=player_shot,
				ai_shot=ai_shot,
				game_status=engine.game_status,
			)
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to fire: {e}") from e

	async def get_state(self, game_id: str) -> GameStateResponse:
		try:
			engine = self.get_engine(game_id)
			return self.build_state_response(game_id, engine)
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to get state: {e}") from e

	def build_state_response(
		self, game_id: str, engine: GameEngine
	) -> GameStateResponse:
		try:
			state = engine.get_state()
			return GameStateResponse(
				game_id=game_id,
				game_status=state["game_status"],
				player_board=state["player_board"],
				ai_board=state["ai_board"],
				player_shots=[
					ShotResult(
						result=s["result"],
						ship=s["ship"],
						coordinate=s["coordinate"],
						sunk_ship_coords=s["sunk_ship_coords"],
					)
					for s in state["player_shots"]
				],
				ai_shots=[
					ShotResult(
						result=s["result"],
						ship=s["ship"],
						coordinate=s["coordinate"],
						sunk_ship_coords=s["sunk_ship_coords"],
					)
					for s in state["ai_shots"]
				],
				player_ships_remaining=state["player_ships_remaining"],
				ai_ships_remaining=state["ai_ships_remaining"],
			)
		except Exception as e:
			raise RuntimeError(f"Failed to build state response: {e}") from e
