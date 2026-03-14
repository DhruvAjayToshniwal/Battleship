from app.engine.ai.ai_base import BattleshipAI
from app.engine.ai.easy_ai import EasyAI
from app.engine.ai.medium_ai import MediumAI
from app.engine.ai.hard_ai import HardAI
from app.engine.board import Board
from app.engine.ship import Ship


DIFFICULTY_MAP: dict[str, type[BattleshipAI]] = {
	"easy": EasyAI,
	"medium": MediumAI,
	"hard": HardAI,
}


def parse_coordinate(coord_str: str, board_size: int = 10) -> tuple[int, int]:
	coord_str = coord_str.strip().upper()
	if len(coord_str) < 2 or len(coord_str) > 3:
		raise ValueError(f"Invalid coordinate format: {coord_str}")

	col_char = coord_str[0]
	max_col = chr(ord("A") + board_size - 1)
	if not col_char.isalpha() or col_char < "A" or col_char > max_col:
		raise ValueError(f"Column must be A-{max_col}, got {col_char}")
	col = ord(col_char) - ord("A")

	try:
		row_num = int(coord_str[1:])
	except ValueError:
		raise ValueError(f"Invalid row number in: {coord_str}")

	if row_num < 1 or row_num > board_size:
		raise ValueError(f"Row must be 1-{board_size}, got {row_num}")
	row = row_num - 1

	return (row, col)


def format_coordinate(coord: tuple[int, int]) -> str:
	row, col = coord
	return f"{chr(ord('A') + col)}{row + 1}"


class BaseGameEngine:
	def fire_shot(self, coord_str: str) -> dict:
		raise NotImplementedError

	def ai_turn(self) -> dict:
		raise NotImplementedError

	def get_state(self) -> dict:
		raise NotImplementedError


class GameEngine(BaseGameEngine):
	def __init__(self, difficulty: str = "hard", board_size: int = 10) -> None:
		self.board_size = board_size
		self.player_board = Board(board_size)
		self.ai_board = Board(board_size)
		self.difficulty = difficulty
		ai_class = DIFFICULTY_MAP.get(difficulty, HardAI)
		self.ai_strategy: BattleshipAI = ai_class(board_size)
		self.game_status: str = "setup"
		self.player_shots: list[dict] = []
		self.ai_shots: list[dict] = []

	def setup_ai(self) -> None:
		try:
			self.ai_board.random_placement()
		except Exception as e:
			raise RuntimeError(f"AI setup failed: {e}") from e

	def place_player_ships(self, placements: list[dict[str, list[str]]]) -> None:
		try:
			if self.player_board.ships:
				raise ValueError("Player ships have already been placed")

			for p in placements:
				name = p["name"]
				coords = [parse_coordinate(c, self.board_size) for c in p["coordinates"]]
				ship = Ship(name, coords)
				self.player_board.place_ship(ship, coords)

			expected_names = set(Ship.SHIP_SIZES.keys())
			placed_names = {s.name for s in self.player_board.ships}
			if placed_names != expected_names:
				missing = expected_names - placed_names
				raise ValueError(f"Missing ships: {missing}")

			self.game_status = "playing"
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Ship placement failed: {e}") from e

	def build_board_state(self) -> list[list[int]]:
		state = [[0] * self.board_size for _ in range(self.board_size)]
		for coord in self.ai_strategy.hit_cells:
			r, c = coord
			state[r][c] = 1
		for coord in self.ai_strategy.miss_cells:
			r, c = coord
			state[r][c] = -1
		return state

	def fire_shot(self, coord_str: str) -> dict:
		try:
			if self.game_status != "playing":
				raise ValueError(f"Cannot fire: game status is {self.game_status}")

			coord = parse_coordinate(coord_str)
			result = self.ai_board.receive_shot(coord)
			shot_record = {
				"coordinate": format_coordinate(coord),
				"result": result["result"],
				"ship": result["ship"],
				"sunk_ship_coords": (
					[format_coordinate(c) for c in result["sunk_ship_coords"]]
					if result["sunk_ship_coords"]
					else None
				),
			}
			self.player_shots.append(shot_record)
			self.check_win()
			return shot_record
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Fire shot failed: {e}") from e

	def ai_turn(self) -> dict:
		try:
			if self.game_status != "playing":
				raise ValueError(f"Cannot fire: game status is {self.game_status}")

			board_state = self.build_board_state()
			coord = self.ai_strategy.choose_move(board_state)
			result = self.player_board.receive_shot(coord)
			self.ai_strategy.record_result(coord, result)

			shot_record = {
				"coordinate": format_coordinate(coord),
				"result": result["result"],
				"ship": result["ship"],
				"sunk_ship_coords": (
					[format_coordinate(c) for c in result["sunk_ship_coords"]]
					if result["sunk_ship_coords"]
					else None
				),
			}
			self.ai_shots.append(shot_record)
			self.check_win()
			return shot_record
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"AI turn failed: {e}") from e

	def check_win(self) -> None:
		if self.ai_board.all_ships_sunk():
			self.game_status = "player_wins"
		elif self.player_board.all_ships_sunk():
			self.game_status = "ai_wins"

	def get_state(self) -> dict:
		try:
			return {
				"game_status": self.game_status,
				"difficulty": self.difficulty,
				"player_board": self.serialize_player_board(),
				"ai_board": self.serialize_ai_board(),
				"player_shots": self.player_shots,
				"ai_shots": self.ai_shots,
				"player_ships_remaining": sum(
					1 for s in self.player_board.ships if not s.is_sunk()
				),
				"ai_ships_remaining": sum(
					1 for s in self.ai_board.ships if not s.is_sunk()
				),
			}
		except Exception as e:
			raise RuntimeError(f"Failed to get state: {e}") from e

	def serialize_player_board(self) -> dict:
		ships = []
		for s in self.player_board.ships:
			ships.append(
				{
					"name": s.name,
					"coordinates": [format_coordinate(c) for c in s.coordinates],
					"hits": [format_coordinate(c) for c in s.hits],
					"sunk": s.is_sunk(),
				}
			)
		return {
			"ships": ships,
			"shots_received": [
				format_coordinate(c) for c in self.player_board.shots_received
			],
		}

	def serialize_ai_board(self) -> dict:
		ships = []
		for s in self.ai_board.ships:
			if s.is_sunk():
				ships.append(
					{
						"name": s.name,
						"coordinates": [format_coordinate(c) for c in s.coordinates],
						"hits": [format_coordinate(c) for c in s.hits],
						"sunk": True,
					}
				)
		hits = []
		misses = []
		for coord in self.ai_board.shots_received:
			coord_str = format_coordinate(coord)
			if self.ai_board.is_occupied(coord):
				hits.append(coord_str)
			else:
				misses.append(coord_str)

		return {
			"ships": ships,
			"hits": hits,
			"misses": misses,
		}
