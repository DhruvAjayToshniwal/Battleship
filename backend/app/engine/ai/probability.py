BOARD_SIZE = 10
HIT_BONUS_MULTIPLIER = 5


def build_probability_grid(
	board_state: list[list[int]],
	remaining_ships: list[int],
	miss_cells: set[tuple[int, int]],
	sunk_coords: set[tuple[int, int]],
	hit_cells: set[tuple[int, int]],
) -> list[list[int]]:
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
	for cell in cells:
		if cell in miss_cells or cell in sunk_coords:
			return False
	return True


def placement_weight(
	cells: list[tuple[int, int]],
	unsunk_hits: set[tuple[int, int]],
) -> int:
	hit_count = sum(1 for cell in cells if cell in unsunk_hits)
	if hit_count > 0:
		return 1 + hit_count * HIT_BONUS_MULTIPLIER
	return 1
