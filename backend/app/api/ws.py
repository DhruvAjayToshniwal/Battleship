import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.db import DatabaseManager
from app.core.websocket_manager import ConnectionManager
from app.repositories.rooms import RoomRepository
from app.services.game_service import GameService

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(
	websocket: WebSocket, room_id: str, token: str = ""
) -> None:
	player_id = None
	try:
		db = DatabaseManager.get_instance()
		async with db.get_session() as session:
			room_repo = RoomRepository(session)
			player = await room_repo.get_player_by_token(token)
			if player is None or player.room_id != room_id:
				await websocket.close(code=4001, reason="Unauthorized")
				return
			player_id = player.id
			player_slot = player.player_slot

		manager = ConnectionManager.get_instance()
		await manager.connect(room_id, player_id, websocket)

		async with db.get_session() as session:
			async with session.begin():
				room_repo = RoomRepository(session)
				await room_repo.set_player_connected(player_id, True)

		await manager.broadcast_to_room(
			room_id,
			{
				"type": "player.reconnected",
				"data": {"player_slot": player_slot, "player_id": player_id},
			},
		)

		try:
			game_service = GameService.get_instance()
			state = await game_service.get_state(room_id, token)
			await manager.send_to_player(
				room_id,
				player_id,
				{"type": "game.state", "data": state},
			)
		except Exception:
			pass

		while True:
			try:
				raw = await websocket.receive_text()
				data = json.loads(raw)
				msg_type = data.get("type", "")

				if msg_type == "heartbeat":
					await manager.send_to_player(
						room_id,
						player_id,
						{"type": "heartbeat", "data": {}},
					)

				elif msg_type == "game.fire":
					try:
						coordinate = data.get("data", {}).get("coordinate", "")
						game_service = GameService.get_instance()
						result = await game_service.fire(room_id, token, coordinate)

						await manager.broadcast_to_room(
							room_id,
							{"type": "game.move", "data": result},
						)

						if result.get("game_status") in (
							"player_wins",
							"ai_wins",
						):
							await manager.broadcast_to_room(
								room_id,
								{
									"type": "game.finished",
									"data": {
										"winner": result.get("actor_player_id"),
										"game_status": result.get("game_status"),
									},
								},
							)

						for pid in manager.get_connected_players(room_id):
							try:
								p_token = None
								async with db.get_session() as sess:
									from sqlalchemy import select
									from app.models.db_models import PlayerSession

									r = await sess.execute(
										select(PlayerSession).where(
											PlayerSession.id == pid
										)
									)
									p = r.scalar_one_or_none()
									if p:
										p_token = p.client_token
								if p_token:
									personal_state = await game_service.get_state(
										room_id, p_token
									)
									await manager.send_to_player(
										room_id,
										pid,
										{
											"type": "game.state",
											"data": personal_state,
										},
									)
							except Exception:
								pass

					except ValueError as e:
						await manager.send_to_player(
							room_id,
							player_id,
							{"type": "error", "data": {"message": str(e)}},
						)
					except Exception as e:
						await manager.send_to_player(
							room_id,
							player_id,
							{"type": "error", "data": {"message": str(e)}},
						)

			except WebSocketDisconnect:
				break
			except json.JSONDecodeError:
				await manager.send_to_player(
					room_id,
					player_id,
					{"type": "error", "data": {"message": "Invalid JSON"}},
				)
			except Exception:
				break

	except WebSocketDisconnect:
		pass
	except Exception:
		pass
	finally:
		if player_id:
			try:
				manager = ConnectionManager.get_instance()
				manager.disconnect(room_id, player_id)

				db = DatabaseManager.get_instance()
				async with db.get_session() as session:
					async with session.begin():
						room_repo = RoomRepository(session)
						await room_repo.set_player_connected(player_id, False)

				await manager.broadcast_to_room(
					room_id,
					{
						"type": "player.disconnected",
						"data": {"player_id": player_id},
					},
				)
			except Exception:
				pass
