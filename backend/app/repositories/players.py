from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import PlayerProfile


class PlayerRepository:
	def __init__(self, session: AsyncSession) -> None:
		self.session = session

	async def get_or_create(
		self, client_id: str, display_name: str = "Player"
	) -> PlayerProfile:
		try:
			result = await self.session.execute(
				select(PlayerProfile).where(PlayerProfile.client_id == client_id)
			)
			profile = result.scalar_one_or_none()
			if profile:
				profile.display_name = display_name
				await self.session.flush()
				return profile
			profile = PlayerProfile(client_id=client_id, display_name=display_name)
			self.session.add(profile)
			await self.session.flush()
			return profile
		except Exception as e:
			raise RuntimeError(f"Failed to get or create player profile: {e}") from e

	async def get_by_client_id(self, client_id: str) -> PlayerProfile | None:
		try:
			result = await self.session.execute(
				select(PlayerProfile).where(PlayerProfile.client_id == client_id)
			)
			return result.scalar_one_or_none()
		except Exception as e:
			raise RuntimeError(f"Failed to get player profile: {e}") from e

	async def record_game_result(
		self, client_id: str, won: bool, shots: int, hits: int
	) -> None:
		try:
			profile = await self.get_by_client_id(client_id)
			if profile:
				if won:
					profile.wins = profile.wins + 1
				else:
					profile.losses = profile.losses + 1
				profile.games_played = profile.games_played + 1
				profile.total_shots = profile.total_shots + shots
				profile.total_hits = profile.total_hits + hits
				await self.session.flush()
		except Exception as e:
			raise RuntimeError(f"Failed to record game result: {e}") from e
