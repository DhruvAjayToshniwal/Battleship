def detect_orientation(hit_cells: list[tuple[int, int]]) -> str | None:
	if len(hit_cells) < 2:
		return None

	rows = set(r for r, c in hit_cells)
	cols = set(c for r, c in hit_cells)

	if len(rows) == 1 and len(cols) > 1:
		return "horizontal"
	if len(cols) == 1 and len(rows) > 1:
		return "vertical"

	return None


def generate_target_cells(
	hit_cells: list[tuple[int, int]],
	shots_taken: set[tuple[int, int]],
	board_size: int = 10,
) -> list[tuple[int, int]]:
	if not hit_cells:
		return []

	orientation = detect_orientation(hit_cells)
	candidates: list[tuple[int, int]] = []

	if orientation == "horizontal":
		row = hit_cells[0][0]
		cols = sorted(c for r, c in hit_cells)
		right = (row, cols[-1] + 1)
		if is_valid_target(right, shots_taken, board_size):
			candidates.append(right)
		left = (row, cols[0] - 1)
		if is_valid_target(left, shots_taken, board_size):
			candidates.append(left)

	elif orientation == "vertical":
		col = hit_cells[0][1]
		rows = sorted(r for r, c in hit_cells)
		down = (rows[-1] + 1, col)
		if is_valid_target(down, shots_taken, board_size):
			candidates.append(down)
		up = (rows[0] - 1, col)
		if is_valid_target(up, shots_taken, board_size):
			candidates.append(up)

	else:
		r, c = hit_cells[0]
		for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
			neighbor = (r + dr, c + dc)
			if is_valid_target(neighbor, shots_taken, board_size):
				candidates.append(neighbor)

	return candidates


def is_valid_target(
	coord: tuple[int, int],
	shots_taken: set[tuple[int, int]],
	board_size: int = 10,
) -> bool:
	r, c = coord
	return 0 <= r < board_size and 0 <= c < board_size and coord not in shots_taken
