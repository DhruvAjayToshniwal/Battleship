from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import GameSnapshot


class GameRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def save_snapshot(self, room_id: str, data: dict) -> GameSnapshot:
        try:
            snapshot = GameSnapshot(room_id=room_id, **data)
            self.session.add(snapshot)
            await self.session.flush()
            return snapshot
        except Exception as e:
            raise RuntimeError(f"Failed to save snapshot: {e}") from e

    async def get_snapshot(self, room_id: str) -> GameSnapshot | None:
        try:
            result = await self.session.execute(
                select(GameSnapshot).where(GameSnapshot.room_id == room_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            raise RuntimeError(f"Failed to get snapshot: {e}") from e

    async def update_snapshot(self, room_id: str, **fields) -> GameSnapshot:
        try:
            snapshot = await self.get_snapshot(room_id)
            if snapshot is None:
                raise ValueError(f"Snapshot for room {room_id} not found")
            for key, value in fields.items():
                setattr(snapshot, key, value)
            await self.session.flush()
            return snapshot
        except ValueError:
            raise
        except Exception as e:
            raise RuntimeError(f"Failed to update snapshot: {e}") from e

    async def delete_snapshot(self, room_id: str) -> None:
        try:
            snapshot = await self.get_snapshot(room_id)
            if snapshot:
                await self.session.delete(snapshot)
                await self.session.flush()
        except Exception as e:
            raise RuntimeError(f"Failed to delete snapshot: {e}") from e
