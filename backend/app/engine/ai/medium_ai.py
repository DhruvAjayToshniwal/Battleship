import random

from app.engine.ai.ai_base import BattleshipAI


class MediumAI(BattleshipAI):
	def __init__(self, board_size: int = 10) -> None:
		super().__init__(board_size)
		self.target_queue: list[tuple[int, int]] = []

	def choose_move(self, board_state: list[list[int]]) -> tuple[int, int]:
		try:
			if self.target_queue:
				return self.target_mode(board_state)
			return self.hunt_mode(board_state)
		except Exception:
			available = self.available_cells()
			return random.choice(available)

	def hunt_mode(self, board_state: list[list[int]]) -> tuple[int, int]:
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
