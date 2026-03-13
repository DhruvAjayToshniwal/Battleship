class Ship:
	SHIP_SIZES = {
		"Carrier": 5,
		"Battleship": 4,
		"Cruiser": 3,
		"Submarine": 3,
		"Destroyer": 2,
	}

	def __init__(self, name: str, coordinates: list[tuple[int, int]]) -> None:
		if name not in self.SHIP_SIZES:
			raise ValueError(f"Unknown ship name: {name}")
		expected = self.SHIP_SIZES[name]
		if len(coordinates) != expected:
			raise ValueError(
				f"{name} requires {expected} coordinates, got {len(coordinates)}"
			)
		self.name = name
		self.size = expected
		self.coordinates: list[tuple[int, int]] = list(coordinates)
		self.hits: set[tuple[int, int]] = set()

	def hit(self, coord: tuple[int, int]) -> bool:
		if coord in self.coordinates:
			self.hits.add(coord)
			return True
		return False

	def is_sunk(self) -> bool:
		return len(self.hits) == self.size

	def __repr__(self) -> str:
		return f"Ship({self.name}, sunk={self.is_sunk()}, hits={len(self.hits)}/{self.size})"
