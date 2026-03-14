from app.core.db import DatabaseManager
from app.core.security import generate_room_code, generate_client_token
from app.repositories.rooms import RoomRepository
from app.repositories.games import GameRepository


class RoomService:
	instance: "RoomService | None" = None

	@classmethod
	def get_instance(cls) -> "RoomService":
		if cls.instance is None:
			cls.instance = cls()
		return cls.instance

	@classmethod
	def reset(cls) -> None:
		cls.instance = None

	async def create_room(
		self, mode: str, display_name: str = "Player", difficulty: str = "hard"
	) -> dict:
		try:
			db = DatabaseManager.get_instance()
			async with db.get_session() as session:
				async with session.begin():
					room_repo = RoomRepository(session)
					game_repo = GameRepository(session)

					room_code = generate_room_code()
					while await room_repo.get_active_by_code(room_code):
						room_code = generate_room_code()

					room = await room_repo.create(room_code, mode)
					client_token = generate_client_token()
					player = await room_repo.add_player(
						room.id, "player1", display_name, client_token
					)

					if mode == "ai":
						from app.services.ai_game_service import AIGameService

						ai_service = AIGameService.get_instance()
						await ai_service.initialize_game(room.id, difficulty, session)
						room.status = "placement"
						await session.flush()

					return {
						"room_id": room.id,
						"room_code": room.room_code,
						"player_id": player.id,
						"client_token": client_token,
						"mode": mode,
						"difficulty": difficulty if mode == "ai" else None,
					}
		except Exception as e:
			raise RuntimeError(f"Failed to create room: {e}") from e

	async def join_room(self, room_code: str, display_name: str = "Player") -> dict:
		try:
			db = DatabaseManager.get_instance()
			async with db.get_session() as session:
				async with session.begin():
					room_repo = RoomRepository(session)

					room = await room_repo.get_active_by_code(room_code.upper())
					if room is None:
						raise ValueError(f"Room with code {room_code} not found")

					if room.mode != "human":
						raise ValueError("Cannot join an AI game room")

					players = await room_repo.get_players_for_room(room.id)
					if len(players) >= 2:
						raise ValueError("Room is full")

					if room.status != "waiting":
						raise ValueError("Room is not accepting new players")

					client_token = generate_client_token()
					player = await room_repo.add_player(
						room.id, "player2", display_name, client_token
					)

					room.status = "placement"
					await session.flush()

					return {
						"room_id": room.id,
						"room_code": room.room_code,
						"player_id": player.id,
						"client_token": client_token,
						"player_slot": "player2",
					}
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to join room: {e}") from e

	async def reconnect(self, client_token: str) -> dict:
		try:
			db = DatabaseManager.get_instance()
			async with db.get_session() as session:
				async with session.begin():
					room_repo = RoomRepository(session)

					player = await room_repo.get_player_by_token(client_token)
					if player is None:
						raise ValueError("Invalid reconnect token")

					room = await room_repo.get_by_id(player.room_id)
					if room is None:
						raise ValueError("Room no longer exists")

					player.connected = True
					await session.flush()

					players = await room_repo.get_players_for_room(room.id)

					return {
						"room_id": room.id,
						"room_code": room.room_code,
						"player_id": player.id,
						"player_slot": player.player_slot,
						"room_status": room.status,
						"mode": room.mode,
						"players": [
							{
								"player_id": p.id,
								"player_slot": p.player_slot,
								"display_name": p.display_name,
								"connected": p.connected,
							}
							for p in players
						],
					}
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to reconnect: {e}") from e

	async def get_room_state(self, room_id: str, client_token: str) -> dict:
		try:
			db = DatabaseManager.get_instance()
			async with db.get_session() as session:
				room_repo = RoomRepository(session)

				player = await room_repo.get_player_by_token(client_token)
				if player is None or player.room_id != room_id:
					raise ValueError("Unauthorized access to room")

				room = await room_repo.get_by_id(room_id)
				if room is None:
					raise ValueError("Room not found")

				players = await room_repo.get_players_for_room(room_id)

				return {
					"room_id": room.id,
					"room_code": room.room_code,
					"mode": room.mode,
					"status": room.status,
					"players": [
						{
							"player_id": p.id,
							"player_slot": p.player_slot,
							"display_name": p.display_name,
							"connected": p.connected,
						}
						for p in players
					],
				}
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to get room state: {e}") from e
