"""
Probability Density Map Builder

Builds a heatmap of ship placement likelihood across the board.

Algorithm:
    For each remaining (unsunk) ship length, enumerate every possible
    horizontal and vertical placement on the board. A placement is
    valid if it does not overlap any known miss or sunk cell. For each
    valid placement, increment a counter on every cell it covers.

    The resulting grid represents how many distinct ship placements
    could pass through each cell — cells with higher counts are more
    likely to contain a ship.

    When there are unsunk hit cells, placements that pass through
    those hits are weighted higher (bonus multiplier), concentrating
    fire around known ship locations.

Example output (5x5 excerpt):
    2  3  5  3  2
    3  6  8  6  3
    5  8 12  8  5
    3  6  8  6  3
    2  3  5  3  2
"""


BOARD_SIZE = 10
HIT_BONUS_MULTIPLIER = 5


def build_probability_grid(
	board_state: list[list[int]],
	remaining_ships: list[int],
	miss_cells: set[tuple[int, int]],
	sunk_coords: set[tuple[int, int]],
	hit_cells: set[tuple[int, int]],
) -> list[list[int]]:
	"""
	Build a probability density grid for the given board state.

	Args:
		board_state: 10x10 grid (0=unknown, -1=miss, 1=hit).
		remaining_ships: List of ship lengths still alive.
		miss_cells: Set of (row, col) known misses.
		sunk_coords: Set of (row, col) belonging to sunk ships.
		hit_cells: Set of (row, col) with confirmed hits (not yet sunk).

	Returns:
		10x10 grid of integer probability scores.
	"""
	grid = [[0] * BOARD_SIZE for _ in range(BOARD_SIZE)]
	unsunk_hits = hit_cells - sunk_coords

	for ship_len in remaining_ships:
		for r in range(BOARD_SIZE):
			for c in range(BOARD_SIZE - ship_len + 1):
				cells = [(r, c + i) for i in range(ship_len)]
				if placement_valid(cells, miss_cells, sunk_coords):
					weight = placement_weight(cells, unsunk_hits)
					for cr, cc in cells:
						grid[cr][cc] += weight

		for r in range(BOARD_SIZE - ship_len + 1):
			for c in range(BOARD_SIZE):
				cells = [(r + i, c) for i in range(ship_len)]
				if placement_valid(cells, miss_cells, sunk_coords):
					weight = placement_weight(cells, unsunk_hits)
					for cr, cc in cells:
						grid[cr][cc] += weight

	for r, c in miss_cells | sunk_coords:
		if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
			grid[r][c] = 0

	return grid


def placement_valid(
	cells: list[tuple[int, int]],
	miss_cells: set[tuple[int, int]],
	sunk_coords: set[tuple[int, int]],
) -> bool:
	"""
	Check if a ship placement is valid — no cell overlaps a miss or sunk coord.
	"""
	for cell in cells:
		if cell in miss_cells or cell in sunk_coords:
			return False
	return True


def placement_weight(
	cells: list[tuple[int, int]],
	unsunk_hits: set[tuple[int, int]],
) -> int:
	"""
	Weight a placement higher if it passes through unsunk hit cells.

	A placement touching hits is much more likely to be the actual ship
	location, so we multiply its contribution to the probability grid.
	"""
	hit_count = sum(1 for cell in cells if cell in unsunk_hits)
	if hit_count > 0:
		return 1 + hit_count * HIT_BONUS_MULTIPLIER
	return 1
