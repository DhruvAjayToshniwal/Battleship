from app.core.db import DatabaseManager
from app.engine.adapter import GameEngineAdapter
from app.engine.game_engine import parse_coordinate, format_coordinate
from app.engine.ship import Ship
from app.repositories.games import GameRepository
from app.repositories.history import HistoryRepository
from app.repositories.players import PlayerRepository
from app.repositories.rooms import RoomRepository


class GameService:
	instance: "GameService | None" = None

	@classmethod
	def get_instance(cls) -> "GameService":
		if cls.instance is None:
			cls.instance = cls()
		return cls.instance

	@classmethod
	def reset(cls) -> None:
		cls.instance = None

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

					room = await room_repo.get_by_id(room_id)
					if room is None:
						raise ValueError("Room not found")

					if room.status not in ("placement", "active"):
						raise ValueError("Not in placement phase")

					snapshot = await game_repo.get_snapshot(room_id)
					if snapshot is None:
						snapshot_data = {
							"game_status": "setup",
							"current_turn": None,
						}
						snapshot = await game_repo.save_snapshot(room_id, snapshot_data)

					engine = GameEngineAdapter.engine_from_snapshot(snapshot)

					if player.player_slot == "player1":
						if snapshot.player1_placed:
							raise ValueError("Ships already placed")
						engine.place_player_ships(ships)
						placed_field = "player1_placed"
					else:
						if snapshot.player2_placed:
							raise ValueError("Ships already placed")

						for p in ships:
							name = p["name"]
							coords = [parse_coordinate(c) for c in p["coordinates"]]
							ship = Ship(name, coords)
							engine.ai_board.place_ship(ship, coords)

						expected_names = set(Ship.SHIP_SIZES.keys())
						placed_names = {s.name for s in engine.ai_board.ships}
						if placed_names != expected_names:
							missing = expected_names - placed_names
							raise ValueError(f"Missing ships: {missing}")

						placed_field = "player2_placed"

					updated = GameEngineAdapter.snapshot_from_engine(engine)
					updated[placed_field] = True

					other_placed = (
						snapshot.player2_placed
						if placed_field == "player1_placed"
						else snapshot.player1_placed
					)

					if other_placed:
						updated["game_status"] = "playing"
						players = await room_repo.get_players_for_room(room_id)
						p1 = next(
							(p for p in players if p.player_slot == "player1"),
							None,
						)
						if p1:
							updated["current_turn"] = p1.id
						await room_repo.update_status(room_id, "active")
					else:
						updated["game_status"] = "setup"

					await game_repo.update_snapshot(room_id, **updated)

					return {
						"placement_complete": other_placed is True,
						"game_status": updated["game_status"],
						"player_slot": player.player_slot,
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

					if snapshot.game_status != "playing":
						raise ValueError(
							f"Cannot fire: game status is {snapshot.game_status}"
						)

					if snapshot.current_turn != player.id:
						raise ValueError("Not your turn")

					engine = GameEngineAdapter.engine_from_snapshot(snapshot)

					coord = parse_coordinate(coordinate)

					if player.player_slot == "player1":
						result = engine.ai_board.receive_shot(coord)
						shot_record = {
							"coordinate": format_coordinate(coord),
							"result": result["result"],
							"ship": result["ship"],
							"sunk_ship_coords": (
								[
									format_coordinate(c)
									for c in result["sunk_ship_coords"]
								]
								if result["sunk_ship_coords"]
								else None
							),
						}
						engine.player_shots.append(shot_record)
					else:
						result = engine.player_board.receive_shot(coord)
						shot_record = {
							"coordinate": format_coordinate(coord),
							"result": result["result"],
							"ship": result["ship"],
							"sunk_ship_coords": (
								[
									format_coordinate(c)
									for c in result["sunk_ship_coords"]
								]
								if result["sunk_ship_coords"]
								else None
							),
						}
						engine.ai_shots.append(shot_record)

					engine.check_win()

					turn = snapshot.turn_number + 1
					await history_repo.record_move(
						room_id=room_id,
						turn_number=turn,
						actor_player_id=player.id,
						coordinate=coordinate,
						result=result["result"],
						sunk_ship=result["ship"]
						if result["result"] == "sunk"
						else None,
					)

					players = await room_repo.get_players_for_room(room_id)
					opponent = next((p for p in players if p.id != player.id), None)

					updated = GameEngineAdapter.snapshot_from_engine(engine)
					updated["turn_number"] = turn

					if engine.game_status in ("player_wins", "ai_wins"):
						await room_repo.set_winner(room_id, player.id)
						updated["current_turn"] = None

						try:
							player_repo = PlayerRepository(session)
							for p in players:
								if p.client_id:
									is_winner = p.id == player.id
									shot_count = len(
										engine.player_shots
										if p.player_slot == "player1"
										else engine.ai_shots
									)
									hit_count = sum(
										1
										for s in (
											engine.player_shots
											if p.player_slot == "player1"
											else engine.ai_shots
										)
										if s.get("result") in ("hit", "sunk")
									)
									await player_repo.record_game_result(
										p.client_id,
										won=is_winner,
										shots=shot_count,
										hits=hit_count,
									)
						except Exception:
							pass
					else:
						updated["current_turn"] = opponent.id if opponent else player.id

					await game_repo.update_snapshot(room_id, **updated)

					return {
						"shot": shot_record,
						"game_status": engine.game_status,
						"turn_number": turn,
						"next_turn": updated["current_turn"],
						"actor_player_id": player.id,
						"actor_slot": player.player_slot,
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

				room = await room_repo.get_by_id(room_id)
				if room is None:
					raise ValueError("Room not found")

				snapshot = await game_repo.get_snapshot(room_id)
				if snapshot is None:
					return {
						"game_id": room_id,
						"game_status": "setup",
						"board_size": 10,
						"player_slot": player.player_slot,
						"your_turn": False,
					}

				engine = GameEngineAdapter.engine_from_snapshot(snapshot)
				view = GameEngineAdapter.serialize_multiplayer_view(
					engine, player.player_slot
				)

				return {
					"game_id": room_id,
					"game_status": snapshot.game_status,
					"board_size": engine.board_size,
					"player_slot": player.player_slot,
					"your_turn": snapshot.current_turn == player.id,
					"turn_number": snapshot.turn_number,
					**view,
				}
		except ValueError:
			raise
		except Exception as e:
			raise RuntimeError(f"Failed to get state: {e}") from e
