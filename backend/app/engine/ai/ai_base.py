from abc import ABC, abstractmethod


SHIP_LENGTHS: dict[str, int] = {
	"Carrier": 5,
	"Battleship": 4,
	"Cruiser": 3,
	"Submarine": 3,
	"Destroyer": 2,
}


class BattleshipAI(ABC):
	def __init__(self, board_size: int = 10) -> None:
		self.board_size: int = board_size
		self.shots_taken: set[tuple[int, int]] = set()
		self.hit_cells: set[tuple[int, int]] = set()
		self.miss_cells: set[tuple[int, int]] = set()
		self.sunk_coords: set[tuple[int, int]] = set()
		self.remaining_ships: list[int] = sorted(SHIP_LENGTHS.values(), reverse=True)

	@abstractmethod
	def choose_move(self, board_state: list[list[int]]) -> tuple[int, int]: ...

	def record_result(self, coord: tuple[int, int], result: dict) -> None:
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
		return [
			(r, c)
			for r in range(self.board_size)
			for c in range(self.board_size)
			if (r, c) not in self.shots_taken
		]
