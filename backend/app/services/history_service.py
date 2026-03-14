from app.core.db import DatabaseManager
from app.repositories.history import HistoryRepository


class HistoryService:
	instance: "HistoryService | None" = None

	@classmethod
	def get_instance(cls) -> "HistoryService":
		if cls.instance is None:
			cls.instance = cls()
		return cls.instance

	@classmethod
	def reset(cls) -> None:
		cls.instance = None

	async def get_completed_games(self, limit: int = 20, offset: int = 0) -> list[dict]:
		try:
			db = DatabaseManager.get_instance()
			async with db.get_session() as session:
				history_repo = HistoryRepository(session)
				return await history_repo.get_completed_games(limit, offset)
		except Exception as e:
			raise RuntimeError(f"Failed to get completed games: {e}") from e

	async def get_game_detail(self, room_id: str) -> dict | None:
		try:
			db = DatabaseManager.get_instance()
			async with db.get_session() as session:
				history_repo = HistoryRepository(session)
				return await history_repo.get_game_detail(room_id)
		except Exception as e:
			raise RuntimeError(f"Failed to get game detail: {e}") from e
