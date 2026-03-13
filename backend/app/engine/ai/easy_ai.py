import random

from app.engine.ai.ai_base import BattleshipAI


class EasyAI(BattleshipAI):
	def choose_move(self, board_state: list[list[int]]) -> tuple[int, int]:
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
