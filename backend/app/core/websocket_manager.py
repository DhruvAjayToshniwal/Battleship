import json

from fastapi import WebSocket


class ConnectionManager:
	instance: "ConnectionManager | None" = None
	active_connections: dict[str, dict[str, WebSocket]] = {}

	@classmethod
	def get_instance(cls) -> "ConnectionManager":
		if cls.instance is None:
			cls.instance = cls()
			cls.instance.active_connections = {}
		return cls.instance

	@classmethod
	def reset(cls) -> None:
		cls.instance = None

	async def connect(self, room_id: str, player_id: str, websocket: WebSocket) -> None:
		try:
			await websocket.accept()
			if room_id not in self.active_connections:
				self.active_connections[room_id] = {}
			self.active_connections[room_id][player_id] = websocket
		except Exception as e:
			raise RuntimeError(f"Failed to connect websocket: {e}") from e

	def disconnect(self, room_id: str, player_id: str) -> None:
		try:
			if room_id in self.active_connections:
				self.active_connections[room_id].pop(player_id, None)
				if not self.active_connections[room_id]:
					del self.active_connections[room_id]
		except Exception as e:
			raise RuntimeError(f"Failed to disconnect websocket: {e}") from e

	async def broadcast_to_room(self, room_id: str, event: dict) -> None:
		try:
			if room_id not in self.active_connections:
				return
			message = json.dumps(event)
			dead_connections = []
			for player_id, ws in self.active_connections[room_id].items():
				try:
					await ws.send_text(message)
				except Exception:
					dead_connections.append(player_id)
			for player_id in dead_connections:
				self.active_connections[room_id].pop(player_id, None)
		except Exception as e:
			raise RuntimeError(f"Failed to broadcast: {e}") from e

	async def send_to_player(self, room_id: str, player_id: str, event: dict) -> None:
		try:
			if room_id not in self.active_connections:
				return
			ws = self.active_connections[room_id].get(player_id)
			if ws:
				try:
					await ws.send_text(json.dumps(event))
				except Exception:
					self.active_connections[room_id].pop(player_id, None)
		except Exception as e:
			raise RuntimeError(f"Failed to send to player: {e}") from e

	def get_connected_players(self, room_id: str) -> list[str]:
		try:
			if room_id not in self.active_connections:
				return []
			return list(self.active_connections[room_id].keys())
		except Exception:
			return []
