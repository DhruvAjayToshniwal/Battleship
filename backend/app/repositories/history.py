from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import GameRoom, MoveHistory, PlayerSession


class HistoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def record_move(
        self,
        room_id: str,
        turn_number: int,
        actor_player_id: str,
        coordinate: str,
        result: str,
        sunk_ship: str | None = None,
    ) -> MoveHistory:
        try:
            move = MoveHistory(
                room_id=room_id,
                turn_number=turn_number,
                actor_player_id=actor_player_id,
                coordinate=coordinate,
                result=result,
                sunk_ship=sunk_ship,
            )
            self.session.add(move)
            await self.session.flush()
            return move
        except Exception as e:
            raise RuntimeError(f"Failed to record move: {e}") from e

    async def get_moves_for_room(self, room_id: str) -> list[MoveHistory]:
        try:
            result = await self.session.execute(
                select(MoveHistory)
                .where(MoveHistory.room_id == room_id)
                .order_by(MoveHistory.turn_number)
            )
            return list(result.scalars().all())
        except Exception as e:
            raise RuntimeError(f"Failed to get moves: {e}") from e

    async def get_completed_games(
        self, limit: int = 20, offset: int = 0
    ) -> list[dict]:
        try:
            result = await self.session.execute(
                select(GameRoom)
                .where(GameRoom.status == "finished")
                .order_by(GameRoom.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            rooms = list(result.scalars().all())
            games = []
            for room in rooms:
                move_count_result = await self.session.execute(
                    select(func.count(MoveHistory.id)).where(
                        MoveHistory.room_id == room.id
                    )
                )
                move_count = move_count_result.scalar() or 0

                players = await self.session.execute(
                    select(PlayerSession).where(PlayerSession.room_id == room.id)
                )
                player_list = list(players.scalars().all())

                winner_name = None
                if room.winner_player_id:
                    for p in player_list:
                        if p.id == room.winner_player_id:
                            winner_name = p.display_name
                            break

                duration = None
                if room.updated_at and room.created_at:
                    duration = int(
                        (room.updated_at - room.created_at).total_seconds()
                    )

                games.append(
                    {
                        "room_id": room.id,
                        "room_code": room.room_code,
                        "mode": room.mode,
                        "status": room.status,
                        "winner_name": winner_name,
                        "winner_player_id": room.winner_player_id,
                        "move_count": move_count,
                        "duration_seconds": duration,
                        "created_at": room.created_at.isoformat() if room.created_at else None,
                        "players": [
                            {
                                "player_id": p.id,
                                "player_slot": p.player_slot,
                                "display_name": p.display_name,
                            }
                            for p in player_list
                        ],
                    }
                )
            return games
        except Exception as e:
            raise RuntimeError(f"Failed to get completed games: {e}") from e

    async def get_game_detail(self, room_id: str) -> dict | None:
        try:
            result = await self.session.execute(
                select(GameRoom).where(GameRoom.id == room_id)
            )
            room = result.scalar_one_or_none()
            if room is None:
                return None

            moves = await self.get_moves_for_room(room_id)

            players_result = await self.session.execute(
                select(PlayerSession).where(PlayerSession.room_id == room_id)
            )
            player_list = list(players_result.scalars().all())

            winner_name = None
            if room.winner_player_id:
                for p in player_list:
                    if p.id == room.winner_player_id:
                        winner_name = p.display_name
                        break

            duration = None
            if room.updated_at and room.created_at:
                duration = int((room.updated_at - room.created_at).total_seconds())

            return {
                "room_id": room.id,
                "room_code": room.room_code,
                "mode": room.mode,
                "status": room.status,
                "winner_name": winner_name,
                "winner_player_id": room.winner_player_id,
                "duration_seconds": duration,
                "created_at": room.created_at.isoformat() if room.created_at else None,
                "players": [
                    {
                        "player_id": p.id,
                        "player_slot": p.player_slot,
                        "display_name": p.display_name,
                    }
                    for p in player_list
                ],
                "moves": [
                    {
                        "turn_number": m.turn_number,
                        "actor_player_id": m.actor_player_id,
                        "coordinate": m.coordinate,
                        "result": m.result,
                        "sunk_ship": m.sunk_ship,
                        "created_at": m.created_at.isoformat() if m.created_at else None,
                    }
                    for m in moves
                ],
            }
        except Exception as e:
            raise RuntimeError(f"Failed to get game detail: {e}") from e
