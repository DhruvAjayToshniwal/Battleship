from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import DatabaseManager
from app.engine.adapter import GameEngineAdapter
from app.engine.game_engine import GameEngine
from app.models.schemas import ShotResult
from app.repositories.games import GameRepository
from app.repositories.history import HistoryRepository
from app.repositories.players import PlayerRepository
from app.repositories.rooms import RoomRepository


class AIGameService:
	instance: "AIGameService | None" = None

	@classmethod
	def get_instance(cls) -> "AIGameService":
		if cls.instance is None:
			cls.instance = cls()
		return cls.instance

	@classmethod
	def reset(cls) -> None:
		cls.instance = None

	async def initialize_game(
		self, room_id: str, difficulty: str, session: AsyncSession
	) -> None:
		try:
			game_repo = GameRepository(session)
			engine = GameEngine(difficulty=difficulty)
			engine.setup_ai()

			snapshot_data = GameEngineAdapter.snapshot_from_engine(engine)
			snapshot_data["difficulty"] = difficulty
			snapshot_data["player2_placed"] = True
			snapshot_data["game_status"] = "setup"

			await game_repo.save_snapshot(room_id, snapshot_data)
		except Exception as e:
			raise RuntimeError(f"Failed to initialize AI game: {e}") from e

	async def place_ships(
		self, room_id: str, client_token: str, ships: list[dict]
	) -> dict:
		try:
			db = DatabaseManager.get_instance()
			async with db.get_session() as session:
				async with session.begin():
					room_repo = RoomRepository(session)
					game_repo = GameRepository(session)

					player = await room_repo.get_player_by_token(client_token)
					if player is None or player.room_id != room_id:
						raise ValueError("Unauthorized")

					snapshot = await game_repo.get_snapshot(room_id)
					if snapshot is None:
						raise ValueError("Game not found")

					engine = GameEngineAdapter.engine_from_snapshot(snapshot)
					engine.place_player_ships(ships)

					updated = GameEngineAdapter.snapshot_from_engine(engine)
					updated["player1_placed"] = True
					updated["game_status"] = "playing"

					room = await room_repo.get_by_id(room_id)
					current_turn = player.id
					updated["current_turn"] = current_turn

					await game_repo.update_snapshot(room_id, **updated)
					await room_repo.update_status(room_id, "active")

					view = GameEngineAdapter.serialize_player_view(engine)
					return {
						"game_id": room_id,
						"game_status": "playing",
						**view,
					}
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to place ships: {e}") from e

	async def fire(self, room_id: str, client_token: str, coordinate: str) -> dict:
		try:
			db = DatabaseManager.get_instance()
			async with db.get_session() as session:
				async with session.begin():
					room_repo = RoomRepository(session)
					game_repo = GameRepository(session)
					history_repo = HistoryRepository(session)

					player = await room_repo.get_player_by_token(client_token)
					if player is None or player.room_id != room_id:
						raise ValueError("Unauthorized")

					snapshot = await game_repo.get_snapshot(room_id)
					if snapshot is None:
						raise ValueError("Game not found")

					engine = GameEngineAdapter.engine_from_snapshot(snapshot)
					if engine.game_status != "playing":
						raise ValueError(
							f"Cannot fire: game status is {engine.game_status}"
						)

					player_result = engine.fire_shot(coordinate)
					player_shot = ShotResult(
						result=player_result["result"],
						ship=player_result["ship"],
						coordinate=player_result["coordinate"],
						sunk_ship_coords=player_result["sunk_ship_coords"],
					)

					turn = snapshot.turn_number + 1
					await history_repo.record_move(
						room_id=room_id,
						turn_number=turn,
						actor_player_id=player.id,
						coordinate=coordinate,
						result=player_result["result"],
						sunk_ship=player_result["ship"]
						if player_result["result"] == "sunk"
						else None,
					)

					ai_shot = None
					if engine.game_status == "playing":
						ai_result = engine.ai_turn()
						ai_shot = ShotResult(
							result=ai_result["result"],
							ship=ai_result["ship"],
							coordinate=ai_result["coordinate"],
							sunk_ship_coords=ai_result["sunk_ship_coords"],
						)

						await history_repo.record_move(
							room_id=room_id,
							turn_number=turn,
							actor_player_id="ai",
							coordinate=ai_result["coordinate"],
							result=ai_result["result"],
							sunk_ship=ai_result["ship"]
							if ai_result["result"] == "sunk"
							else None,
						)

					updated = GameEngineAdapter.snapshot_from_engine(engine)
					updated["turn_number"] = turn
					updated["current_turn"] = player.id
					await game_repo.update_snapshot(room_id, **updated)

					if engine.game_status in ("player_wins", "ai_wins"):
						winner_id = (
							player.id if engine.game_status == "player_wins" else "ai"
						)
						await room_repo.set_winner(room_id, winner_id)

						try:
							if player.client_id:
								player_repo = PlayerRepository(session)
								player_shots_count = len(engine.player_shots)
								player_hits_count = sum(
									1
									for s in engine.player_shots
									if s.get("result") in ("hit", "sunk")
								)
								await player_repo.record_game_result(
									player.client_id,
									won=engine.game_status == "player_wins",
									shots=player_shots_count,
									hits=player_hits_count,
								)
						except Exception:
							pass

					return {
						"player_shot": player_shot,
						"ai_shot": ai_shot,
						"game_status": engine.game_status,
					}
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to fire: {e}") from e

	async def get_state(self, room_id: str, client_token: str) -> dict:
		try:
			db = DatabaseManager.get_instance()
			async with db.get_session() as session:
				room_repo = RoomRepository(session)
				game_repo = GameRepository(session)

				player = await room_repo.get_player_by_token(client_token)
				if player is None or player.room_id != room_id:
					raise ValueError("Unauthorized")

				snapshot = await game_repo.get_snapshot(room_id)
				if snapshot is None:
					raise ValueError("Game not found")

				engine = GameEngineAdapter.engine_from_snapshot(snapshot)
				view = GameEngineAdapter.serialize_player_view(engine)

				return {
					"game_id": room_id,
					"game_status": engine.game_status,
					**view,
				}
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to get state: {e}") from e
