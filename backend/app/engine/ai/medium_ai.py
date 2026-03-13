"""
Medium AI — Hunt + Target with Checkerboard Optimization

Two-mode algorithm:

HUNT MODE (searching for ships):
    Uses a checkerboard pattern to halve the search space. Since every
    ship has length >= 2, each ship must occupy at least one cell on
    the checkerboard. Picks randomly among checkerboard cells first.

        X . X . X . X . X .
        . X . X . X . X . X
        X . X . X . X . X .
        ...

TARGET MODE (sinking a found ship):
    When a hit is scored, the AI pushes all 4 adjacent cells into a
    target queue. It fires at queued cells until the ship sinks, then
    returns to hunt mode.

Expected performance: ~55-65 turns on average.
"""

import random

from app.engine.ai.ai_base import BattleshipAI


class MediumAI(BattleshipAI):
	"""Hunt + Target strategy with checkerboard-patterned hunting."""

	def __init__(self) -> None:
		super().__init__()
		self.target_queue: list[tuple[int, int]] = []

	def choose_move(self, board_state: list[list[int]]) -> tuple[int, int]:
		"""
		If targets are queued (we have unsunk hits), fire at the next target.
		Otherwise, hunt using checkerboard pattern.
		"""
		try:
			if self.target_queue:
				return self.target_mode(board_state)
			return self.hunt_mode(board_state)
		except Exception:
			available = self.available_cells()
			return random.choice(available)

	def hunt_mode(self, board_state: list[list[int]]) -> tuple[int, int]:
		"""
		Pick a random unknown cell, preferring checkerboard-patterned cells.

		The checkerboard pattern ensures we find every ship with ~half the
		shots compared to pure random, since no ship can fit entirely on
		one color of the checkerboard.
		"""
		unknown = [
			(r, c)
			for r in range(self.board_size)
			for c in range(self.board_size)
			if board_state[r][c] == 0 and (r, c) not in self.shots_taken
		]
		if not unknown:
			return random.choice(self.available_cells())

		checkerboard = [(r, c) for r, c in unknown if (r + c) % 2 == 0]
		if checkerboard:
			return random.choice(checkerboard)
		return random.choice(unknown)

	def target_mode(self, board_state: list[list[int]]) -> tuple[int, int]:
		"""
		Fire at queued target cells (adjacent to confirmed hits).

		Filters out already-shot cells and cells that are out of bounds.
		If the queue empties, falls back to hunt mode.
		"""
		while self.target_queue:
			candidate = self.target_queue.pop(0)
			r, c = candidate
			if (
				0 <= r < self.board_size
				and 0 <= c < self.board_size
				and candidate not in self.shots_taken
			):
				return candidate

		return self.hunt_mode(board_state)

	def record_result(self, coord: tuple[int, int], result: dict) -> None:
		"""
		After recording the result, queue adjacent cells on hits
		and clean the queue on sinks.
		"""
		super().record_result(coord, result)

		try:
			if result["result"] in ("hit", "sunk"):
				r, c = coord
				for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
					neighbor = (r + dr, c + dc)
					if (
						0 <= neighbor[0] < self.board_size
						and 0 <= neighbor[1] < self.board_size
						and neighbor not in self.shots_taken
						and neighbor not in self.target_queue
					):
						self.target_queue.append(neighbor)

			if result["result"] == "sunk":
				sunk_coords = result.get("sunk_ship_coords", [])
				if sunk_coords:
					sunk_set = set(tuple(c) for c in sunk_coords)
					self.target_queue = [
						t for t in self.target_queue if t not in sunk_set
					]
		except Exception:
			pass
