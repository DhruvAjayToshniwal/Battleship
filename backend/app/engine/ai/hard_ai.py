"""
Hard AI — Probability Density Search + Orientation Targeting

The strongest practical Battleship algorithm. Combines two techniques:

1. PROBABILITY DENSITY MAP
   For every remaining ship, enumerate all valid placements (positions
   where the ship could legally exist given known misses). Each cell's
   score = number of valid placements passing through it. The AI fires
   at the highest-scoring cell.

   Placements that pass through existing (unsunk) hits are weighted
   heavily, concentrating fire on partially-damaged ships.

2. ORIENTATION TARGETING
   When multiple unsunk hits form a line, the AI detects the ship's
   orientation (horizontal/vertical) and only fires along that axis.
   This eliminates wasted perpendicular shots and typically sinks a
   ship in 1-2 extra shots after the first hit.

Expected performance: ~40-45 turns on average.

The combination of probability-based hunting and orientation-aware
targeting makes this extremely difficult to beat.
"""

import random

from app.engine.ai.ai_base import BattleshipAI
from app.engine.ai.probability import build_probability_grid
from app.engine.ai.orientation_target import detect_orientation, generate_target_cells


class HardAI(BattleshipAI):
	"""
	Probability heatmap hunter with orientation-aware targeting.

	In hunt mode: fires at the cell with the highest probability score.
	In target mode: uses orientation detection to extend along ship axes,
	falling back to probability-weighted adjacent selection.
	"""

	def choose_move(self, board_state: list[list[int]]) -> tuple[int, int]:
		"""
		Determine the next shot using probability analysis and orientation targeting.

		If unsunk hits exist, enter target mode. Otherwise, hunt using the
		probability density map.
		"""
		try:
			unsunk_hits = list(self.hit_cells - self.sunk_coords)

			if unsunk_hits:
				return self.target_mode(board_state, unsunk_hits)
			return self.hunt_mode(board_state)
		except Exception:
			available = self.available_cells()
			return random.choice(available)

	def hunt_mode(self, board_state: list[list[int]]) -> tuple[int, int]:
		"""
		Fire at the cell with the highest probability of containing a ship.

		Builds a probability density grid across all remaining ship placements,
		then selects the maximum-scoring cell. Ties are broken by checkerboard
		preference (since all ships span >= 2 cells, checkerboard cells are
		statistically better).
		"""
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
		"""
		Focus fire around unsunk hit cells using orientation detection.

		Groups hits by adjacency to identify which belong to the same ship,
		detects orientation, and extends along the ship's axis. If orientation
		is unknown (single hit), uses probability-weighted adjacent selection.
		"""
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
				targets.sort(
					key=lambda t: prob_grid[t[0]][t[1]], reverse=True
				)
				return targets[0]

		return self.hunt_mode(board_state)

	def group_adjacent_hits(
		self, hits: list[tuple[int, int]]
	) -> list[list[tuple[int, int]]]:
		"""
		Group unsunk hits into clusters of adjacent cells (likely same ship).

		Uses union-find logic: two hits are in the same group if they are
		cardinally adjacent (distance 1 in row or column, not both).
		"""
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
