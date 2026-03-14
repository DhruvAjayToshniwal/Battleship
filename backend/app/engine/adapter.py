from app.engine.board import Board
from app.engine.ship import Ship
from app.engine.game_engine import GameEngine, format_coordinate, parse_coordinate
from app.engine.ai.ai_base import BattleshipAI
from app.engine.ai.easy_ai import EasyAI
from app.engine.ai.medium_ai import MediumAI
from app.engine.ai.hard_ai import HardAI


DIFFICULTY_AI_MAP: dict[str, type[BattleshipAI]] = {
	"easy": EasyAI,
	"medium": MediumAI,
	"hard": HardAI,
}


class GameEngineAdapter:
	@staticmethod
	def serialize_board(board: Board) -> dict:
		try:
			ships_data = []
			for ship in board.ships:
				ships_data.append(
					{
						"name": ship.name,
						"coordinates": [format_coordinate(c) for c in ship.coordinates],
						"hits": [format_coordinate(c) for c in ship.hits],
					}
				)
			return {
				"ships": ships_data,
				"shots_received": [format_coordinate(c) for c in board.shots_received],
			}
		except Exception as e:
			raise RuntimeError(f"Failed to serialize board: {e}") from e

	@staticmethod
	def deserialize_board(data: dict) -> Board:
		try:
			board = Board()
			for ship_data in data.get("ships", []):
				coords = [parse_coordinate(c) for c in ship_data["coordinates"]]
				ship = Ship(ship_data["name"], coords)
				board.place_ship(ship, coords)
				for hit_str in ship_data.get("hits", []):
					hit_coord = parse_coordinate(hit_str)
					ship.hit(hit_coord)
			for shot_str in data.get("shots_received", []):
				board.shots_received.add(parse_coordinate(shot_str))
			return board
		except Exception as e:
			raise RuntimeError(f"Failed to deserialize board: {e}") from e

	@staticmethod
	def serialize_ai_state(ai: BattleshipAI) -> dict:
		try:
			state = {
				"shots_taken": [list(c) for c in ai.shots_taken],
				"hit_cells": [list(c) for c in ai.hit_cells],
				"miss_cells": [list(c) for c in ai.miss_cells],
				"sunk_coords": [list(c) for c in ai.sunk_coords],
				"remaining_ships": list(ai.remaining_ships),
			}
			if isinstance(ai, MediumAI):
				state["target_queue"] = [list(c) for c in ai.target_queue]
			return state
		except Exception as e:
			raise RuntimeError(f"Failed to serialize AI state: {e}") from e

	@staticmethod
	def deserialize_ai_state(data: dict, difficulty: str) -> BattleshipAI:
		try:
			ai_class = DIFFICULTY_AI_MAP.get(difficulty, HardAI)
			ai = ai_class()
			ai.shots_taken = {tuple(c) for c in data.get("shots_taken", [])}
			ai.hit_cells = {tuple(c) for c in data.get("hit_cells", [])}
			ai.miss_cells = {tuple(c) for c in data.get("miss_cells", [])}
			ai.sunk_coords = {tuple(c) for c in data.get("sunk_coords", [])}
			ai.remaining_ships = list(data.get("remaining_ships", []))
			if isinstance(ai, MediumAI) and "target_queue" in data:
				ai.target_queue = [tuple(c) for c in data["target_queue"]]
			return ai
		except Exception as e:
			raise RuntimeError(f"Failed to deserialize AI state: {e}") from e

	@staticmethod
	def engine_from_snapshot(snapshot) -> GameEngine:
		try:
			difficulty = snapshot.difficulty or "hard"
			engine = GameEngine.__new__(GameEngine)
			engine.difficulty = difficulty
			engine.game_status = snapshot.game_status
			engine.player_shots = list(snapshot.player1_shots or [])
			engine.ai_shots = list(snapshot.player2_shots or [])

			if snapshot.player1_board:
				engine.player_board = GameEngineAdapter.deserialize_board(
					snapshot.player1_board
				)
			else:
				engine.player_board = Board()

			if snapshot.player2_board:
				engine.ai_board = GameEngineAdapter.deserialize_board(
					snapshot.player2_board
				)
			else:
				engine.ai_board = Board()

			if snapshot.ai_strategy_state:
				engine.ai_strategy = GameEngineAdapter.deserialize_ai_state(
					snapshot.ai_strategy_state, difficulty
				)
			else:
				ai_class = DIFFICULTY_AI_MAP.get(difficulty, HardAI)
				engine.ai_strategy = ai_class()

			return engine
		except Exception as e:
			raise RuntimeError(f"Failed to create engine from snapshot: {e}") from e

	@staticmethod
	def snapshot_from_engine(engine: GameEngine) -> dict:
		try:
			return {
				"player1_board": GameEngineAdapter.serialize_board(engine.player_board),
				"player2_board": GameEngineAdapter.serialize_board(engine.ai_board),
				"player1_shots": list(engine.player_shots),
				"player2_shots": list(engine.ai_shots),
				"player1_ships_remaining": sum(
					1 for s in engine.player_board.ships if not s.is_sunk()
				),
				"player2_ships_remaining": sum(
					1 for s in engine.ai_board.ships if not s.is_sunk()
				),
				"game_status": engine.game_status,
				"ai_strategy_state": GameEngineAdapter.serialize_ai_state(
					engine.ai_strategy
				)
				if hasattr(engine, "ai_strategy")
				else None,
			}
		except Exception as e:
			raise RuntimeError(f"Failed to create snapshot from engine: {e}") from e

	@staticmethod
	def serialize_player_view(engine: GameEngine) -> dict:
		try:
			player_ships = []
			for s in engine.player_board.ships:
				player_ships.append(
					{
						"name": s.name,
						"coordinates": [format_coordinate(c) for c in s.coordinates],
						"hits": [format_coordinate(c) for c in s.hits],
						"sunk": s.is_sunk(),
					}
				)

			enemy_ships = []
			for s in engine.ai_board.ships:
				if s.is_sunk():
					enemy_ships.append(
						{
							"name": s.name,
							"coordinates": [
								format_coordinate(c) for c in s.coordinates
							],
							"hits": [format_coordinate(c) for c in s.hits],
							"sunk": True,
						}
					)

			hits = []
			misses = []
			for coord in engine.ai_board.shots_received:
				coord_str = format_coordinate(coord)
				if engine.ai_board.is_occupied(coord):
					hits.append(coord_str)
				else:
					misses.append(coord_str)

			return {
				"player_board": {
					"ships": player_ships,
					"shots_received": [
						format_coordinate(c) for c in engine.player_board.shots_received
					],
				},
				"ai_board": {
					"ships": enemy_ships,
					"hits": hits,
					"misses": misses,
				},
				"player_shots": engine.player_shots,
				"ai_shots": engine.ai_shots,
				"player_ships_remaining": sum(
					1 for s in engine.player_board.ships if not s.is_sunk()
				),
				"ai_ships_remaining": sum(
					1 for s in engine.ai_board.ships if not s.is_sunk()
				),
			}
		except Exception as e:
			raise RuntimeError(f"Failed to serialize player view: {e}") from e

	@staticmethod
	def serialize_multiplayer_view(engine: GameEngine, player_slot: str) -> dict:
		try:
			if player_slot == "player1":
				my_board = engine.player_board
				opponent_board = engine.ai_board
				my_shots = engine.player_shots
				opponent_shots = engine.ai_shots
			else:
				my_board = engine.ai_board
				opponent_board = engine.player_board
				my_shots = engine.ai_shots
				opponent_shots = engine.player_shots

			my_ships = []
			for s in my_board.ships:
				my_ships.append(
					{
						"name": s.name,
						"coordinates": [format_coordinate(c) for c in s.coordinates],
						"hits": [format_coordinate(c) for c in s.hits],
						"sunk": s.is_sunk(),
					}
				)

			enemy_ships = []
			for s in opponent_board.ships:
				if s.is_sunk():
					enemy_ships.append(
						{
							"name": s.name,
							"coordinates": [
								format_coordinate(c) for c in s.coordinates
							],
							"hits": [format_coordinate(c) for c in s.hits],
							"sunk": True,
						}
					)

			enemy_hits = []
			enemy_misses = []
			for coord in opponent_board.shots_received:
				coord_str = format_coordinate(coord)
				if opponent_board.is_occupied(coord):
					enemy_hits.append(coord_str)
				else:
					enemy_misses.append(coord_str)

			return {
				"player_board": {
					"ships": my_ships,
					"shots_received": [
						format_coordinate(c) for c in my_board.shots_received
					],
				},
				"opponent_board": {
					"ships": enemy_ships,
					"hits": enemy_hits,
					"misses": enemy_misses,
				},
				"my_shots": my_shots,
				"opponent_shots": opponent_shots,
				"my_ships_remaining": sum(1 for s in my_board.ships if not s.is_sunk()),
				"opponent_ships_remaining": sum(
					1 for s in opponent_board.ships if not s.is_sunk()
				),
			}
		except Exception as e:
			raise RuntimeError(f"Failed to serialize multiplayer view: {e}") from e
