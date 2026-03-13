import random
from typing import Optional

from app.engine.ship import Ship


class BaseBoard:
	SIZE = 10

	def __init__(self) -> None:
		self.ships: list[Ship] = []
		self.shots_received: set[tuple[int, int]] = set()
		self.occupied: dict[tuple[int, int], Ship] = {}

	def all_ships_sunk(self) -> bool:
		return all(s.is_sunk() for s in self.ships)

	def is_occupied(self, coord: tuple[int, int]) -> bool:
		return coord in self.occupied

	def get_ship_at(self, coord: tuple[int, int]) -> Optional[Ship]:
		return self.occupied.get(coord)


class Board(BaseBoard):
	def place_ship(self, ship: Ship, coordinates: list[tuple[int, int]]) -> None:
		try:
			if len(coordinates) != ship.size:
				raise ValueError(
					f"{ship.name} needs {ship.size} cells, got {len(coordinates)}"
				)

			for r, c in coordinates:
				if not (0 <= r < self.SIZE and 0 <= c < self.SIZE):
					raise ValueError(f"Coordinate ({r}, {c}) is out of bounds")

			for coord in coordinates:
				if coord in self.occupied:
					raise ValueError(
						f"Cell {coord} already occupied by {self.occupied[coord].name}"
					)

			self.validate_alignment(coordinates)

			ship.coordinates = list(coordinates)
			self.ships.append(ship)
			for coord in coordinates:
				self.occupied[coord] = ship
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to place ship: {e}") from e

	@staticmethod
	def validate_alignment(coordinates: list[tuple[int, int]]) -> None:
		rows = sorted(set(r for r, _ in coordinates))
		cols = sorted(set(c for _, c in coordinates))

		if len(rows) == 1:
			expected = list(range(cols[0], cols[0] + len(coordinates)))
			if sorted(c for _, c in coordinates) != expected:
				raise ValueError("Coordinates are not consecutive horizontally")
		elif len(cols) == 1:
			expected = list(range(rows[0], rows[0] + len(coordinates)))
			if sorted(r for r, _ in coordinates) != expected:
				raise ValueError("Coordinates are not consecutive vertically")
		else:
			raise ValueError("Ship must be placed horizontally or vertically")

	def receive_shot(self, coord: tuple[int, int]) -> dict:
		try:
			if not (0 <= coord[0] < self.SIZE and 0 <= coord[1] < self.SIZE):
				raise ValueError(f"Shot coordinate {coord} out of bounds")
			if coord in self.shots_received:
				raise ValueError(f"Cell {coord} has already been targeted")

			self.shots_received.add(coord)

			ship = self.occupied.get(coord)
			if ship is None:
				return {
					"result": "miss",
					"ship": None,
					"sunk": False,
					"sunk_ship_coords": None,
				}

			ship.hit(coord)
			if ship.is_sunk():
				return {
					"result": "sunk",
					"ship": ship.name,
					"sunk": True,
					"sunk_ship_coords": list(ship.coordinates),
				}
			return {
				"result": "hit",
				"ship": ship.name,
				"sunk": False,
				"sunk_ship_coords": None,
			}
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to process shot: {e}") from e

	def random_placement(self) -> None:
		try:
			for name, size in Ship.SHIP_SIZES.items():
				placed = False
				while not placed:
					orientation = random.choice(["horizontal", "vertical"])
					if orientation == "horizontal":
						row = random.randint(0, self.SIZE - 1)
						col = random.randint(0, self.SIZE - size)
						coords = [(row, col + i) for i in range(size)]
					else:
						row = random.randint(0, self.SIZE - size)
						col = random.randint(0, self.SIZE - 1)
						coords = [(row + i, col) for i in range(size)]

					if any(c in self.occupied for c in coords):
						continue

					ship = Ship(name, coords)
					self.place_ship(ship, coords)
					placed = True
		except Exception as e:
			raise RuntimeError(f"Random placement failed: {e}") from e
