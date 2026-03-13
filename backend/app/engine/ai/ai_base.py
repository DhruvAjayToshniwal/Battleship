"""
Base class for all Battleship AI strategies.

Every AI difficulty level implements choose_move() which takes the current
board state and returns the (row, col) to fire at next. The AI also tracks
its own internal state via record_result() after each shot.

Board state encoding:
    0  = unknown / not yet fired
    -1 = miss
    1  = hit
"""

from abc import ABC, abstractmethod


BOARD_SIZE = 10

SHIP_LENGTHS: dict[str, int] = {
	"Carrier": 5,
	"Battleship": 4,
	"Cruiser": 3,
	"Submarine": 3,
	"Destroyer": 2,
}


class BattleshipAI(ABC):
	"""Abstract base for all difficulty levels."""

	def __init__(self) -> None:
		self.board_size: int = BOARD_SIZE
		self.shots_taken: set[tuple[int, int]] = set()
		self.hit_cells: set[tuple[int, int]] = set()
		self.miss_cells: set[tuple[int, int]] = set()
		self.sunk_coords: set[tuple[int, int]] = set()
		self.remaining_ships: list[int] = sorted(SHIP_LENGTHS.values(), reverse=True)

	@abstractmethod
	def choose_move(self, board_state: list[list[int]]) -> tuple[int, int]:
		"""
		Given the current board state, return the (row, col) to fire at.

		Args:
			board_state: 10x10 grid where 0=unknown, -1=miss, 1=hit.

		Returns:
			(row, col) tuple for the next shot.
		"""
		...

	def record_result(self, coord: tuple[int, int], result: dict) -> None:
		"""
		Record the outcome of a shot so the AI can update its internal state.

		Args:
			coord: The (row, col) that was fired at.
			result: Dict with at minimum {"result": "hit"|"miss"|"sunk"}.
				    On sunk, also includes "sunk_ship_coords": list of (row,col).
		"""
		try:
			self.shots_taken.add(coord)

			if result["result"] == "miss":
				self.miss_cells.add(coord)
				return

			self.hit_cells.add(coord)

			if result["result"] == "sunk":
				sunk_coords = result.get("sunk_ship_coords", [])
				if sunk_coords:
					sunk_set = set(tuple(c) for c in sunk_coords)
					self.sunk_coords.update(sunk_set)
					ship_size = len(sunk_coords)
					if ship_size in self.remaining_ships:
						self.remaining_ships.remove(ship_size)
		except Exception:
			pass

	def available_cells(self) -> list[tuple[int, int]]:
		"""Return all cells that have not been fired at yet."""
		return [
			(r, c)
			for r in range(self.board_size)
			for c in range(self.board_size)
			if (r, c) not in self.shots_taken
		]
