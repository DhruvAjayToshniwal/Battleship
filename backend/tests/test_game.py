import sys
import os

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.engine.ship import Ship
from app.engine.board import Board
from app.engine.game_engine import GameEngine, parse_coordinate, format_coordinate
from app.engine.ai.easy_ai import EasyAI
from app.engine.ai.medium_ai import MediumAI
from app.engine.ai.hard_ai import HardAI


class TestCoordinateParsing:
	def test_parse_a1(self):
		assert parse_coordinate("A1") == (0, 0)

	def test_parse_j10(self):
		assert parse_coordinate("J10") == (9, 9)

	def test_parse_b7(self):
		assert parse_coordinate("B7") == (6, 1)

	def test_parse_lowercase(self):
		assert parse_coordinate("c3") == (2, 2)

	def test_format_roundtrip(self):
		for col in range(10):
			for row in range(10):
				coord = (row, col)
				assert parse_coordinate(format_coordinate(coord)) == coord

	def test_invalid_column(self):
		with pytest.raises(ValueError):
			parse_coordinate("K1")

	def test_invalid_row(self):
		with pytest.raises(ValueError):
			parse_coordinate("A0")

	def test_invalid_row_11(self):
		with pytest.raises(ValueError):
			parse_coordinate("A11")


class TestShip:
	def test_create_ship(self):
		ship = Ship("Destroyer", [(0, 0), (0, 1)])
		assert ship.name == "Destroyer"
		assert ship.size == 2

	def test_hit_and_sunk(self):
		ship = Ship("Destroyer", [(0, 0), (0, 1)])
		assert not ship.is_sunk()
		ship.hit((0, 0))
		assert not ship.is_sunk()
		ship.hit((0, 1))
		assert ship.is_sunk()

	def test_hit_wrong_coord(self):
		ship = Ship("Destroyer", [(0, 0), (0, 1)])
		assert ship.hit((5, 5)) is False

	def test_invalid_name(self):
		with pytest.raises(ValueError):
			Ship("Dinghy", [(0, 0)])

	def test_wrong_size(self):
		with pytest.raises(ValueError):
			Ship("Carrier", [(0, 0), (0, 1)])


class TestBoard:
	def make_board_with_destroyer(self) -> Board:
		board = Board()
		ship = Ship("Destroyer", [(0, 0), (0, 1)])
		board.place_ship(ship, [(0, 0), (0, 1)])
		return board

	def test_place_ship(self):
		board = self.make_board_with_destroyer()
		assert len(board.ships) == 1
		assert board.is_occupied((0, 0))
		assert not board.is_occupied((0, 2))

	def test_overlap_rejected(self):
		board = self.make_board_with_destroyer()
		ship2 = Ship("Submarine", [(0, 0), (1, 0), (2, 0)])
		with pytest.raises(ValueError, match="occupied"):
			board.place_ship(ship2, [(0, 0), (1, 0), (2, 0)])

	def test_out_of_bounds(self):
		board = Board()
		ship = Ship("Destroyer", [(0, 9), (0, 10)])
		with pytest.raises(ValueError, match="out of bounds"):
			board.place_ship(ship, [(0, 9), (0, 10)])

	def test_diagonal_rejected(self):
		board = Board()
		ship = Ship("Destroyer", [(0, 0), (1, 1)])
		with pytest.raises(ValueError):
			board.place_ship(ship, [(0, 0), (1, 1)])

	def test_receive_shot_miss(self):
		board = self.make_board_with_destroyer()
		result = board.receive_shot((5, 5))
		assert result["result"] == "miss"

	def test_receive_shot_hit(self):
		board = self.make_board_with_destroyer()
		result = board.receive_shot((0, 0))
		assert result["result"] == "hit"
		assert result["ship"] == "Destroyer"

	def test_receive_shot_sunk(self):
		board = self.make_board_with_destroyer()
		board.receive_shot((0, 0))
		result = board.receive_shot((0, 1))
		assert result["result"] == "sunk"
		assert result["ship"] == "Destroyer"
		assert result["sunk_ship_coords"] is not None

	def test_duplicate_shot_rejected(self):
		board = self.make_board_with_destroyer()
		board.receive_shot((5, 5))
		with pytest.raises(ValueError, match="already been targeted"):
			board.receive_shot((5, 5))

	def test_all_ships_sunk(self):
		board = self.make_board_with_destroyer()
		assert not board.all_ships_sunk()
		board.receive_shot((0, 0))
		board.receive_shot((0, 1))
		assert board.all_ships_sunk()

	def test_random_placement(self):
		board = Board()
		board.random_placement()
		assert len(board.ships) == 5
		names = {s.name for s in board.ships}
		assert names == set(Ship.SHIP_SIZES.keys())
		all_coords = []
		for s in board.ships:
			all_coords.extend(s.coordinates)
		assert len(all_coords) == len(set(all_coords))


class TestGameEngine:
	@staticmethod
	def standard_placements() -> list[dict]:
		return [
			{"name": "Carrier", "coordinates": ["A1", "A2", "A3", "A4", "A5"]},
			{"name": "Battleship", "coordinates": ["B1", "B2", "B3", "B4"]},
			{"name": "Cruiser", "coordinates": ["C1", "C2", "C3"]},
			{"name": "Submarine", "coordinates": ["D1", "D2", "D3"]},
			{"name": "Destroyer", "coordinates": ["E1", "E2"]},
		]

	def test_full_setup(self):
		engine = GameEngine()
		engine.setup_ai()
		engine.place_player_ships(self.standard_placements())
		assert engine.game_status == "playing"

	def test_difficulty_default(self):
		engine = GameEngine()
		assert engine.difficulty == "hard"

	def test_difficulty_easy(self):
		engine = GameEngine(difficulty="easy")
		assert engine.difficulty == "easy"
		assert isinstance(engine.ai_strategy, EasyAI)

	def test_difficulty_medium(self):
		engine = GameEngine(difficulty="medium")
		assert engine.difficulty == "medium"
		assert isinstance(engine.ai_strategy, MediumAI)

	def test_difficulty_hard(self):
		engine = GameEngine(difficulty="hard")
		assert engine.difficulty == "hard"
		assert isinstance(engine.ai_strategy, HardAI)

	def test_fire_and_get_result(self):
		engine = GameEngine()
		engine.setup_ai()
		engine.place_player_ships(self.standard_placements())
		result = engine.fire_shot("A1")
		assert result["result"] in ("hit", "miss", "sunk")

	def test_ai_turn(self):
		engine = GameEngine()
		engine.setup_ai()
		engine.place_player_ships(self.standard_placements())
		result = engine.ai_turn()
		assert result["result"] in ("hit", "miss", "sunk")
		assert result["coordinate"] is not None

	def test_cannot_fire_during_setup(self):
		engine = GameEngine()
		engine.setup_ai()
		with pytest.raises(ValueError, match="setup"):
			engine.fire_shot("A1")

	def test_win_detection(self):
		engine = GameEngine()
		engine.setup_ai()
		engine.place_player_ships(self.standard_placements())

		for r in range(10):
			for c in range(10):
				if engine.game_status != "playing":
					break
				coord_str = format_coordinate((r, c))
				try:
					engine.fire_shot(coord_str)
				except ValueError:
					continue
				if engine.game_status == "playing":
					engine.ai_turn()
			if engine.game_status != "playing":
				break

		assert engine.game_status in ("player_wins", "ai_wins")

	def test_get_state_hides_ai_ships(self):
		engine = GameEngine()
		engine.setup_ai()
		engine.place_player_ships(self.standard_placements())
		state = engine.get_state()
		assert len(state["ai_board"]["ships"]) == 0
		assert len(state["player_board"]["ships"]) == 5

	def test_duplicate_placement_rejected(self):
		engine = GameEngine()
		engine.setup_ai()
		engine.place_player_ships(self.standard_placements())
		with pytest.raises(ValueError, match="already been placed"):
			engine.place_player_ships(self.standard_placements())


class TestEasyAI:
	def test_choose_move_returns_valid_cell(self):
		ai = EasyAI()
		board = [[0] * 10 for _ in range(10)]
		coord = ai.choose_move(board)
		assert 0 <= coord[0] < 10
		assert 0 <= coord[1] < 10

	def test_no_repeat_shots(self):
		ai = EasyAI()
		board = [[0] * 10 for _ in range(10)]
		seen = set()
		for _ in range(50):
			coord = ai.choose_move(board)
			assert coord not in seen
			seen.add(coord)
			ai.record_result(coord, {"result": "miss", "ship": None})
			board[coord[0]][coord[1]] = -1


class TestMediumAI:
	def test_choose_move_returns_valid_cell(self):
		ai = MediumAI()
		board = [[0] * 10 for _ in range(10)]
		coord = ai.choose_move(board)
		assert 0 <= coord[0] < 10
		assert 0 <= coord[1] < 10

	def test_targets_adjacent_after_hit(self):
		ai = MediumAI()
		board = [[0] * 10 for _ in range(10)]
		c1 = (5, 5)
		ai.shots_taken.add(c1)
		ai.record_result(c1, {"result": "hit", "ship": "Destroyer"})
		board[5][5] = 1
		c2 = ai.choose_move(board)
		diff = abs(c2[0] - c1[0]) + abs(c2[1] - c1[1])
		assert diff == 1, f"Expected adjacent cell, got {c1} -> {c2}"

	def test_clears_targets_after_sunk(self):
		ai = MediumAI()
		board = [[0] * 10 for _ in range(10)]
		ai.shots_taken.add((5, 5))
		ai.record_result((5, 5), {"result": "hit", "ship": "Destroyer"})
		ai.shots_taken.add((5, 6))
		ai.record_result(
			(5, 6),
			{
				"result": "sunk",
				"ship": "Destroyer",
				"sunk_ship_coords": [(5, 5), (5, 6)],
			},
		)
		remaining_targets = [t for t in ai.target_queue if t not in {(5, 5), (5, 6)}]
		ai.target_queue = remaining_targets
		board[5][5] = 1
		board[5][6] = 1
		coord = ai.choose_move(board)
		assert coord not in {(5, 5), (5, 6)}


class TestHardAI:
	def test_choose_move_returns_valid_cell(self):
		ai = HardAI()
		board = [[0] * 10 for _ in range(10)]
		coord = ai.choose_move(board)
		assert 0 <= coord[0] < 10
		assert 0 <= coord[1] < 10

	def test_no_repeat_shots(self):
		ai = HardAI()
		board = [[0] * 10 for _ in range(10)]
		seen = set()
		for _ in range(50):
			coord = ai.choose_move(board)
			assert coord not in seen
			seen.add(coord)
			ai.record_result(coord, {"result": "miss", "ship": None})
			board[coord[0]][coord[1]] = -1

	def test_targets_near_hits(self):
		ai = HardAI()
		board = [[0] * 10 for _ in range(10)]
		ai.shots_taken.add((5, 5))
		ai.record_result((5, 5), {"result": "hit", "ship": "Battleship"})
		board[5][5] = 1
		coord = ai.choose_move(board)
		diff = abs(coord[0] - 5) + abs(coord[1] - 5)
		assert diff == 1, f"Expected adjacent cell, got (5,5) -> {coord}"

	def test_extends_along_orientation(self):
		ai = HardAI()
		board = [[0] * 10 for _ in range(10)]
		ai.shots_taken.add((5, 3))
		ai.record_result((5, 3), {"result": "hit", "ship": "Battleship"})
		board[5][3] = 1
		ai.shots_taken.add((5, 4))
		ai.record_result((5, 4), {"result": "hit", "ship": "Battleship"})
		board[5][4] = 1
		coord = ai.choose_move(board)
		assert coord[0] == 5, f"Should extend horizontally, got row {coord[0]}"
		assert coord[1] in (2, 5), f"Should extend left or right, got col {coord[1]}"

	def test_all_100_cells_covered(self):
		ai = HardAI()
		board = [[0] * 10 for _ in range(10)]
		for _ in range(100):
			coord = ai.choose_move(board)
			ai.record_result(coord, {"result": "miss", "ship": None})
			board[coord[0]][coord[1]] = -1
		assert len(ai.shots_taken) == 100


class TestProbabilityGrid:
	def test_center_higher_than_corners(self):
		from app.engine.ai.probability import build_probability_grid

		board = [[0] * 10 for _ in range(10)]
		ships = [5, 4, 3, 3, 2]
		grid = build_probability_grid(board, ships, set(), set(), set())
		center = grid[4][4] + grid[4][5] + grid[5][4] + grid[5][5]
		corners = grid[0][0] + grid[0][9] + grid[9][0] + grid[9][9]
		assert center > corners

	def test_misses_reduce_probability(self):
		from app.engine.ai.probability import build_probability_grid

		board = [[0] * 10 for _ in range(10)]
		ships = [3]
		grid_before = build_probability_grid(board, ships, set(), set(), set())
		miss_cells = {(4, 4)}
		grid_after = build_probability_grid(board, ships, miss_cells, set(), set())
		assert grid_after[4][4] == 0
		assert grid_after[4][3] < grid_before[4][3]


class TestOrientationDetection:
	def test_horizontal(self):
		from app.engine.ai.orientation_target import detect_orientation

		assert detect_orientation([(5, 3), (5, 4), (5, 5)]) == "horizontal"

	def test_vertical(self):
		from app.engine.ai.orientation_target import detect_orientation

		assert detect_orientation([(3, 5), (4, 5), (5, 5)]) == "vertical"

	def test_single_hit(self):
		from app.engine.ai.orientation_target import detect_orientation

		assert detect_orientation([(5, 5)]) is None

	def test_target_generation_horizontal(self):
		from app.engine.ai.orientation_target import generate_target_cells

		targets = generate_target_cells([(5, 3), (5, 4)], set())
		coords = set(targets)
		assert (5, 5) in coords
		assert (5, 2) in coords
		assert (4, 3) not in coords
