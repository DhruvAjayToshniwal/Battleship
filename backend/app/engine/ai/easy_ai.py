"""
Easy AI — Random Search

Algorithm:
    Pick a random unshot cell on the board. No strategy, no pattern,
    no memory of hits beyond avoiding repeat shots.

Expected performance: ~90+ turns to sink all ships.

This is intentionally weak to give beginners a fair chance.
"""

import random

from app.engine.ai.ai_base import BattleshipAI


class EasyAI(BattleshipAI):
	"""Fires at random unexplored cells. No targeting logic."""

	def choose_move(self, board_state: list[list[int]]) -> tuple[int, int]:
		"""
		Scan the board for unknown cells (value 0) and pick one at random.

		Falls back to any available cell if board_state is inconsistent.
		"""
		try:
			unknown = [
				(r, c)
				for r in range(self.board_size)
				for c in range(self.board_size)
				if board_state[r][c] == 0 and (r, c) not in self.shots_taken
			]
			if unknown:
				return random.choice(unknown)
			available = self.available_cells()
			if available:
				return random.choice(available)
			raise RuntimeError("No available cells")
		except Exception:
			available = self.available_cells()
			return random.choice(available)
