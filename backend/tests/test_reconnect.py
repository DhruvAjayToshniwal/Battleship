import pytest


VALID_SHIPS = [
	{"name": "Carrier", "coordinates": ["A1", "A2", "A3", "A4", "A5"]},
	{"name": "Battleship", "coordinates": ["B1", "B2", "B3", "B4"]},
	{"name": "Cruiser", "coordinates": ["C1", "C2", "C3"]},
	{"name": "Submarine", "coordinates": ["D1", "D2", "D3"]},
	{"name": "Destroyer", "coordinates": ["E1", "E2"]},
]

CLIENT_UUID_1 = "test-uuid-player-1"
CLIENT_UUID_2 = "test-uuid-player-2"


@pytest.mark.asyncio
async def test_ai_reconnect_during_setup(client):
	create_resp = await client.post(
		"/rooms",
		json={
			"mode": "ai",
			"display_name": "Alice",
			"difficulty": "easy",
			"client_id": CLIENT_UUID_1,
		},
	)
	assert create_resp.status_code == 201
	data = create_resp.json()
	room_id = data["room_id"]

	reconnect_resp = await client.post(
		"/rooms/reconnect",
		headers={"X-Client-Id": CLIENT_UUID_1},
	)
	assert reconnect_resp.status_code == 200
	rdata = reconnect_resp.json()
	assert rdata["room_id"] == room_id
	assert rdata["client_token"] == data["client_token"]
	assert rdata["player_slot"] == "player1"
	assert rdata["mode"] == "ai"
	assert rdata["room_status"] == "placement"


@pytest.mark.asyncio
async def test_ai_reconnect_during_gameplay(client):
	create_resp = await client.post(
		"/rooms",
		json={
			"mode": "ai",
			"display_name": "Alice",
			"difficulty": "easy",
			"client_id": CLIENT_UUID_1,
		},
	)
	data = create_resp.json()
	room_id = data["room_id"]
	token = data["client_token"]

	await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": token, "ships": VALID_SHIPS},
	)

	await client.post(
		f"/rooms/{room_id}/fire",
		json={"client_token": token, "coordinate": "F1"},
	)

	reconnect_resp = await client.post(
		"/rooms/reconnect",
		headers={"X-Client-Id": CLIENT_UUID_1},
	)
	assert reconnect_resp.status_code == 200
	rdata = reconnect_resp.json()
	assert rdata["room_id"] == room_id
	assert rdata["client_token"] == token
	assert rdata["mode"] == "ai"
	assert rdata["room_status"] in ("playing", "active")

	state_resp = await client.get(
		f"/rooms/{room_id}/state",
		headers={"X-Client-Token": token},
	)
	assert state_resp.status_code == 200
	state = state_resp.json()
	assert state["game_status"] == "playing"
	assert len(state["player_shots"]) >= 1


@pytest.mark.asyncio
async def test_ai_reconnect_after_game_over(client):
	create_resp = await client.post(
		"/rooms",
		json={
			"mode": "ai",
			"display_name": "Alice",
			"difficulty": "easy",
			"client_id": CLIENT_UUID_1,
		},
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
			status = fire_resp.json().get("game_status")
			if status in ("player_wins", "ai_wins"):
				break
		else:
			continue
		break

	reconnect_resp = await client.post(
		"/rooms/reconnect",
		headers={"X-Client-Id": CLIENT_UUID_1},
	)
	assert reconnect_resp.status_code == 404


@pytest.mark.asyncio
async def test_multiplayer_reconnect_both_players(client):
	create_resp = await client.post(
		"/rooms",
		json={"mode": "human", "display_name": "Alice", "client_id": CLIENT_UUID_1},
	)
	data = create_resp.json()
	room_id = data["room_id"]
	room_code = data["room_code"]

	join_resp = await client.post(
		"/rooms/join",
		json={
			"room_code": room_code,
			"display_name": "Bob",
			"client_id": CLIENT_UUID_2,
		},
	)
	assert join_resp.status_code == 200

	p1_reconnect = await client.post(
		"/rooms/reconnect",
		headers={"X-Client-Id": CLIENT_UUID_1},
	)
	assert p1_reconnect.status_code == 200
	p1_data = p1_reconnect.json()
	assert p1_data["room_id"] == room_id
	assert p1_data["player_slot"] == "player1"
	assert p1_data["client_token"] == data["client_token"]
	assert len(p1_data["players"]) == 2

	p2_reconnect = await client.post(
		"/rooms/reconnect",
		headers={"X-Client-Id": CLIENT_UUID_2},
	)
	assert p2_reconnect.status_code == 200
	p2_data = p2_reconnect.json()
	assert p2_data["room_id"] == room_id
	assert p2_data["player_slot"] == "player2"
	assert p2_data["client_token"] == join_resp.json()["client_token"]


@pytest.mark.asyncio
async def test_reconnect_no_active_room(client):
	resp = await client.post(
		"/rooms/reconnect",
		headers={"X-Client-Id": "nonexistent-uuid-xyz"},
	)
	assert resp.status_code == 404


@pytest.mark.asyncio
async def test_reconnect_returns_latest_room(client):
	create_resp_1 = await client.post(
		"/rooms",
		json={
			"mode": "ai",
			"display_name": "Alice",
			"difficulty": "easy",
			"client_id": CLIENT_UUID_1,
		},
	)
	room1_id = create_resp_1.json()["room_id"]
	token1 = create_resp_1.json()["client_token"]

	await client.post(
		f"/rooms/{room1_id}/place-ships",
		json={"client_token": token1, "ships": VALID_SHIPS},
	)
	for row in range(10):
		for col in range(10):
			coord = f"{chr(65 + col)}{row + 1}"
			fire_resp = await client.post(
				f"/rooms/{room1_id}/fire",
				json={"client_token": token1, "coordinate": coord},
			)
			status = fire_resp.json().get("game_status")
			if status in ("player_wins", "ai_wins"):
				break
		else:
			continue
		break

	create_resp_2 = await client.post(
		"/rooms",
		json={
			"mode": "ai",
			"display_name": "Alice",
			"difficulty": "easy",
			"client_id": CLIENT_UUID_1,
		},
	)
	room2_id = create_resp_2.json()["room_id"]

	reconnect_resp = await client.post(
		"/rooms/reconnect",
		headers={"X-Client-Id": CLIENT_UUID_1},
	)
	assert reconnect_resp.status_code == 200
	assert reconnect_resp.json()["room_id"] == room2_id


@pytest.mark.asyncio
async def test_reconnect_state_survives_multiple_refreshes(client):
	create_resp = await client.post(
		"/rooms",
		json={
			"mode": "ai",
			"display_name": "Alice",
			"difficulty": "easy",
			"client_id": CLIENT_UUID_1,
		},
	)
	data = create_resp.json()
	room_id = data["room_id"]
	token = data["client_token"]

	await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": token, "ships": VALID_SHIPS},
	)

	await client.post(
		f"/rooms/{room_id}/fire",
		json={"client_token": token, "coordinate": "F1"},
	)
	await client.post(
		f"/rooms/{room_id}/fire",
		json={"client_token": token, "coordinate": "F2"},
	)

	for attempt in range(3):
		reconnect_resp = await client.post(
			"/rooms/reconnect",
			headers={"X-Client-Id": CLIENT_UUID_1},
		)
		assert reconnect_resp.status_code == 200
		rdata = reconnect_resp.json()
		assert rdata["room_id"] == room_id
		assert rdata["client_token"] == token

		state_resp = await client.get(
			f"/rooms/{room_id}/state",
			headers={"X-Client-Token": token},
		)
		assert state_resp.status_code == 200
		state = state_resp.json()
		assert state["game_status"] == "playing"
		assert len(state["player_shots"]) >= 2


@pytest.mark.asyncio
async def test_custom_board_size_ai(client):
	create_resp = await client.post(
		"/rooms",
		json={
			"mode": "ai",
			"display_name": "Alice",
			"difficulty": "easy",
			"client_id": CLIENT_UUID_1,
			"board_size": 7,
		},
	)
	assert create_resp.status_code == 201
	data = create_resp.json()
	assert data["board_size"] == 7
	room_id = data["room_id"]
	token = data["client_token"]

	ships = [
		{"name": "Carrier", "coordinates": ["A1", "A2", "A3", "A4", "A5"]},
		{"name": "Battleship", "coordinates": ["B1", "B2", "B3", "B4"]},
		{"name": "Cruiser", "coordinates": ["C1", "C2", "C3"]},
		{"name": "Submarine", "coordinates": ["D1", "D2", "D3"]},
		{"name": "Destroyer", "coordinates": ["E1", "E2"]},
	]
	place_resp = await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": token, "ships": ships},
	)
	assert place_resp.status_code == 200
	assert place_resp.json()["board_size"] == 7

	fire_resp = await client.post(
		f"/rooms/{room_id}/fire",
		json={"client_token": token, "coordinate": "A1"},
	)
	assert fire_resp.status_code == 200

	state_resp = await client.get(
		f"/rooms/{room_id}/state",
		headers={"X-Client-Token": token},
	)
	assert state_resp.status_code == 200
	assert state_resp.json()["board_size"] == 7


@pytest.mark.asyncio
async def test_board_size_out_of_range(client):
	resp = await client.post(
		"/rooms",
		json={"mode": "ai", "display_name": "Alice", "board_size": 3},
	)
	assert resp.status_code == 422

	resp = await client.post(
		"/rooms",
		json={"mode": "ai", "display_name": "Alice", "board_size": 30},
	)
	assert resp.status_code == 422


@pytest.mark.asyncio
async def test_board_size_coordinate_validation(client):
	create_resp = await client.post(
		"/rooms",
		json={
			"mode": "ai",
			"display_name": "Alice",
			"difficulty": "easy",
			"board_size": 7,
		},
	)
	data = create_resp.json()
	room_id = data["room_id"]
	token = data["client_token"]

	ships = [
		{"name": "Carrier", "coordinates": ["A1", "A2", "A3", "A4", "A5"]},
		{"name": "Battleship", "coordinates": ["B1", "B2", "B3", "B4"]},
		{"name": "Cruiser", "coordinates": ["C1", "C2", "C3"]},
		{"name": "Submarine", "coordinates": ["D1", "D2", "D3"]},
		{"name": "Destroyer", "coordinates": ["E1", "E2"]},
	]
	await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": token, "ships": ships},
	)

	fire_resp = await client.post(
		f"/rooms/{room_id}/fire",
		json={"client_token": token, "coordinate": "H1"},
	)
	assert fire_resp.status_code == 400
