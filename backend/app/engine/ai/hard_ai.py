import random

from app.engine.ai.ai_base import BattleshipAI
from app.engine.ai.probability import build_probability_grid
from app.engine.ai.orientation_target import detect_orientation, generate_target_cells


class HardAI(BattleshipAI):
	def choose_move(self, board_state: list[list[int]]) -> tuple[int, int]:
		try:
			unsunk_hits = list(self.hit_cells - self.sunk_coords)

			if unsunk_hits:
				return self.target_mode(board_state, unsunk_hits)
			return self.hunt_mode(board_state)
		except Exception:
			available = self.available_cells()
			return random.choice(available)

	def hunt_mode(self, board_state: list[list[int]]) -> tuple[int, int]:
		prob_grid = build_probability_grid(
			board_state,
			self.remaining_ships,
			self.miss_cells,
			self.sunk_coords,
			self.hit_cells,
		)

		max_score = 0
		best_cells: list[tuple[int, int]] = []

		for r in range(self.board_size):
			for c in range(self.board_size):
				if (r, c) in self.shots_taken:
					continue
				score = prob_grid[r][c]
				if score > max_score:
					max_score = score
					best_cells = [(r, c)]
				elif score == max_score and score > 0:
					best_cells.append((r, c))

		if not best_cells:
			return random.choice(self.available_cells())

		checkerboard = [(r, c) for r, c in best_cells if (r + c) % 2 == 0]
		if checkerboard:
			return random.choice(checkerboard)
		return random.choice(best_cells)

	def target_mode(
		self,
		board_state: list[list[int]],
		unsunk_hits: list[tuple[int, int]],
	) -> tuple[int, int]:
		ship_groups = self.group_adjacent_hits(unsunk_hits)

		for group in ship_groups:
			targets = generate_target_cells(group, self.shots_taken)
			if targets:
				if len(targets) == 1:
					return targets[0]

				prob_grid = build_probability_grid(
					board_state,
					self.remaining_ships,
					self.miss_cells,
					self.sunk_coords,
					self.hit_cells,
				)
				targets.sort(key=lambda t: prob_grid[t[0]][t[1]], reverse=True)
				return targets[0]

		return self.hunt_mode(board_state)

	def group_adjacent_hits(
		self, hits: list[tuple[int, int]]
	) -> list[list[tuple[int, int]]]:
		if not hits:
			return []

		remaining = set(hits)
		groups: list[list[tuple[int, int]]] = []

		while remaining:
			seed = remaining.pop()
			group = [seed]
			queue = [seed]

			while queue:
				current = queue.pop(0)
				r, c = current
				for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
					neighbor = (r + dr, c + dc)
					if neighbor in remaining:
						remaining.discard(neighbor)
						group.append(neighbor)
						queue.append(neighbor)

			groups.append(group)

		groups.sort(key=len, reverse=True)
		return groups
