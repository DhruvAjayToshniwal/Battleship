import pytest


SHIPS_P1 = [
	{"name": "Carrier", "coordinates": ["A1", "A2", "A3", "A4", "A5"]},
	{"name": "Battleship", "coordinates": ["B1", "B2", "B3", "B4"]},
	{"name": "Cruiser", "coordinates": ["C1", "C2", "C3"]},
	{"name": "Submarine", "coordinates": ["D1", "D2", "D3"]},
	{"name": "Destroyer", "coordinates": ["E1", "E2"]},
]

SHIPS_P2 = [
	{"name": "Carrier", "coordinates": ["F1", "F2", "F3", "F4", "F5"]},
	{"name": "Battleship", "coordinates": ["G1", "G2", "G3", "G4"]},
	{"name": "Cruiser", "coordinates": ["H1", "H2", "H3"]},
	{"name": "Submarine", "coordinates": ["I1", "I2", "I3"]},
	{"name": "Destroyer", "coordinates": ["J1", "J2"]},
]


async def create_and_join(client):
	p1_resp = await client.post(
		"/rooms", json={"mode": "human", "display_name": "Alice"}
	)
	p1_data = p1_resp.json()

	p2_resp = await client.post(
		"/rooms/join",
		json={"room_code": p1_data["room_code"], "display_name": "Bob"},
	)
	p2_data = p2_resp.json()

	return p1_data, p2_data


@pytest.mark.asyncio
async def test_multiplayer_placement_flow(client):
	p1, p2 = await create_and_join(client)
	room_id = p1["room_id"]

	resp1 = await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": p1["client_token"], "ships": SHIPS_P1},
	)
	assert resp1.status_code == 200
	assert resp1.json()["placement_complete"] is False

	resp2 = await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": p2["client_token"], "ships": SHIPS_P2},
	)
	assert resp2.status_code == 200
	assert resp2.json()["placement_complete"] is True
	assert resp2.json()["game_status"] == "playing"


@pytest.mark.asyncio
async def test_multiplayer_turn_order(client):
	p1, p2 = await create_and_join(client)
	room_id = p1["room_id"]

	await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": p1["client_token"], "ships": SHIPS_P1},
	)
	await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": p2["client_token"], "ships": SHIPS_P2},
	)

	fire_resp = await client.post(
		f"/rooms/{room_id}/fire",
		json={"client_token": p1["client_token"], "coordinate": "F1"},
	)
	assert fire_resp.status_code == 200

	wrong_turn_resp = await client.post(
		f"/rooms/{room_id}/fire",
		json={"client_token": p1["client_token"], "coordinate": "F2"},
	)
	assert wrong_turn_resp.status_code == 400
	assert "not your turn" in wrong_turn_resp.json()["detail"].lower()

	fire_resp2 = await client.post(
		f"/rooms/{room_id}/fire",
		json={"client_token": p2["client_token"], "coordinate": "A1"},
	)
	assert fire_resp2.status_code == 200


@pytest.mark.asyncio
async def test_multiplayer_anti_cheat_state(client):
	p1, p2 = await create_and_join(client)
	room_id = p1["room_id"]

	await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": p1["client_token"], "ships": SHIPS_P1},
	)
	await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": p2["client_token"], "ships": SHIPS_P2},
	)

	state_resp = await client.get(
		f"/rooms/{room_id}/state",
		headers={"X-Client-Token": p1["client_token"]},
	)
	assert state_resp.status_code == 200
	state = state_resp.json()

	assert len(state["player_board"]["ships"]) == 5
	assert len(state["opponent_board"]["ships"]) == 0


@pytest.mark.asyncio
async def test_multiplayer_win_detection(client):
	p1, p2 = await create_and_join(client)
	room_id = p1["room_id"]

	await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": p1["client_token"], "ships": SHIPS_P1},
	)
	await client.post(
		f"/rooms/{room_id}/place-ships",
		json={"client_token": p2["client_token"], "ships": SHIPS_P2},
	)

	p2_ship_coords = []
	for ship in SHIPS_P2:
		p2_ship_coords.extend(ship["coordinates"])

	p1_dummy_coords = [
		f"{chr(65 + c)}{r + 1}"
		for r in range(10)
		for c in range(10)
		if f"{chr(65 + c)}{r + 1}"
		not in [c for s in SHIPS_P1 for c in s["coordinates"]]
	]
	p1_dummy_idx = 0

	game_over = False
	for coord in p2_ship_coords:
		fire_resp = await client.post(
			f"/rooms/{room_id}/fire",
			json={"client_token": p1["client_token"], "coordinate": coord},
		)
		assert fire_resp.status_code == 200

		if fire_resp.json()["game_status"] in ("player_wins", "ai_wins"):
			game_over = True
			break

		counter_resp = await client.post(
			f"/rooms/{room_id}/fire",
			json={
				"client_token": p2["client_token"],
				"coordinate": p1_dummy_coords[p1_dummy_idx],
			},
		)
		p1_dummy_idx += 1

		if counter_resp.json()["game_status"] in ("player_wins", "ai_wins"):
			game_over = True
			break

	assert game_over
