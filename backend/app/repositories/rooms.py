from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import GameRoom, PlayerSession


class RoomRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, room_code: str, mode: str) -> GameRoom:
        try:
            room = GameRoom(room_code=room_code, mode=mode)
            self.session.add(room)
            await self.session.flush()
            return room
        except Exception as e:
            raise RuntimeError(f"Failed to create room: {e}") from e

    async def get_by_id(self, room_id: str) -> GameRoom | None:
        try:
            result = await self.session.execute(
                select(GameRoom).where(GameRoom.id == room_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            raise RuntimeError(f"Failed to get room by id: {e}") from e

    async def get_by_code(self, room_code: str) -> GameRoom | None:
        try:
            result = await self.session.execute(
                select(GameRoom).where(GameRoom.room_code == room_code)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            raise RuntimeError(f"Failed to get room by code: {e}") from e

    async def get_active_by_code(self, room_code: str) -> GameRoom | None:
        try:
            result = await self.session.execute(
                select(GameRoom).where(
                    GameRoom.room_code == room_code,
                    GameRoom.status.notin_(["finished", "abandoned"]),
                )
            )
            return result.scalar_one_or_none()
        except Exception as e:
            raise RuntimeError(f"Failed to get active room: {e}") from e

    async def update_status(self, room_id: str, status: str) -> GameRoom:
        try:
            room = await self.get_by_id(room_id)
            if room is None:
                raise ValueError(f"Room {room_id} not found")
            room.status = status
            await self.session.flush()
            return room
        except ValueError:
            raise
        except Exception as e:
            raise RuntimeError(f"Failed to update room status: {e}") from e

    async def set_winner(self, room_id: str, winner_player_id: str) -> GameRoom:
        try:
            room = await self.get_by_id(room_id)
            if room is None:
                raise ValueError(f"Room {room_id} not found")
            room.winner_player_id = winner_player_id
            room.status = "finished"
            await self.session.flush()
            return room
        except ValueError:
            raise
        except Exception as e:
            raise RuntimeError(f"Failed to set winner: {e}") from e

    async def add_player(
        self, room_id: str, player_slot: str, display_name: str, client_token: str
    ) -> PlayerSession:
        try:
            player = PlayerSession(
                room_id=room_id,
                player_slot=player_slot,
                display_name=display_name,
                client_token=client_token,
            )
            self.session.add(player)
            await self.session.flush()
            return player
        except Exception as e:
            raise RuntimeError(f"Failed to add player: {e}") from e

    async def get_player_by_token(self, client_token: str) -> PlayerSession | None:
        try:
            result = await self.session.execute(
                select(PlayerSession).where(PlayerSession.client_token == client_token)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            raise RuntimeError(f"Failed to get player by token: {e}") from e

    async def get_players_for_room(self, room_id: str) -> list[PlayerSession]:
        try:
            result = await self.session.execute(
                select(PlayerSession).where(PlayerSession.room_id == room_id)
            )
            return list(result.scalars().all())
        except Exception as e:
            raise RuntimeError(f"Failed to get players: {e}") from e

    async def set_player_connected(self, player_id: str, connected: bool) -> None:
        try:
            result = await self.session.execute(
                select(PlayerSession).where(PlayerSession.id == player_id)
            )
            player = result.scalar_one_or_none()
            if player:
                player.connected = connected
                await self.session.flush()
        except Exception as e:
            raise RuntimeError(f"Failed to update player connection: {e}") from e
