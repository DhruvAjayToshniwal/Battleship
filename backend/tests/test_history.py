import pytest


VALID_SHIPS = [
	{"name": "Carrier", "coordinates": ["A1", "A2", "A3", "A4", "A5"]},
	{"name": "Battleship", "coordinates": ["B1", "B2", "B3", "B4"]},
	{"name": "Cruiser", "coordinates": ["C1", "C2", "C3"]},
	{"name": "Submarine", "coordinates": ["D1", "D2", "D3"]},
	{"name": "Destroyer", "coordinates": ["E1", "E2"]},
]


@pytest.mark.asyncio
async def test_history_empty(client):
	resp = await client.get("/games/history")
	assert resp.status_code == 200
	assert resp.json()["games"] == []


@pytest.mark.asyncio
async def test_history_after_ai_game(client):
	create_resp = await client.post(
		"/rooms", json={"mode": "ai", "display_name": "Alice", "difficulty": "easy"}
	)
	data = create_resp.json()
	room_id = data["room_id"]
	token = data["client_token"]

	await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": token, "ships": VALID_SHIPS},
	)

	for row in range(10):
		for col in range(10):
			coord = f"{chr(65 + col)}{row + 1}"
			fire_resp = await client.post(
				f"/rooms/{room_id}/fire",
				json={"client_token": token, "coordinate": coord},
			)
			if fire_resp.json().get("game_status") in ("player_wins", "ai_wins"):
				break
		else:
			continue
		break

	history_resp = await client.get("/games/history")
	assert history_resp.status_code == 200
	games = history_resp.json()["games"]
	assert len(games) >= 1

	game = games[0]
	assert game["mode"] == "ai"
	assert game["move_count"] > 0
