import pytest


VALID_SHIPS = [
    {"name": "Carrier", "coordinates": ["A1", "A2", "A3", "A4", "A5"]},
    {"name": "Battleship", "coordinates": ["B1", "B2", "B3", "B4"]},
    {"name": "Cruiser", "coordinates": ["C1", "C2", "C3"]},
    {"name": "Submarine", "coordinates": ["D1", "D2", "D3"]},
    {"name": "Destroyer", "coordinates": ["E1", "E2"]},
]


@pytest.mark.asyncio
async def test_ai_game_full_flow(client):
    create_resp = await client.post(
        "/rooms", json={"mode": "ai", "display_name": "Alice", "difficulty": "easy"}
    )
    assert create_resp.status_code == 201
    data = create_resp.json()
    room_id = data["room_id"]
    token = data["client_token"]

    place_resp = await client.post(
        f"/rooms/{room_id}/place-ships",
        json={"client_token": token, "ships": VALID_SHIPS},
    )
    assert place_resp.status_code == 200
    pdata = place_resp.json()
    assert pdata["game_status"] == "playing"

    state_resp = await client.get(
        f"/rooms/{room_id}/state",
        headers={"X-Client-Token": token},
    )
    assert state_resp.status_code == 200
    sdata = state_resp.json()
    assert sdata["game_status"] == "playing"
    assert sdata["player_ships_remaining"] == 5
    assert sdata["ai_ships_remaining"] == 5

    fire_resp = await client.post(
        f"/rooms/{room_id}/fire",
        json={"client_token": token, "coordinate": "A1"},
    )
    assert fire_resp.status_code == 200
    fdata = fire_resp.json()
    assert "player_shot" in fdata
    assert fdata["player_shot"]["coordinate"] == "A1"
    assert fdata["player_shot"]["result"] in ("hit", "miss", "sunk")


@pytest.mark.asyncio
async def test_ai_game_duplicate_placement(client):
    create_resp = await client.post(
        "/rooms", json={"mode": "ai", "display_name": "Alice"}
    )
    data = create_resp.json()
    room_id = data["room_id"]
    token = data["client_token"]

    await client.post(
        f"/rooms/{room_id}/place-ships",
        json={"client_token": token, "ships": VALID_SHIPS},
    )

    dup_resp = await client.post(
        f"/rooms/{room_id}/place-ships",
        json={"client_token": token, "ships": VALID_SHIPS},
    )
    assert dup_resp.status_code == 400


@pytest.mark.asyncio
async def test_ai_game_fire_before_placement(client):
    create_resp = await client.post(
        "/rooms", json={"mode": "ai", "display_name": "Alice"}
    )
    data = create_resp.json()
    room_id = data["room_id"]
    token = data["client_token"]

    fire_resp = await client.post(
        f"/rooms/{room_id}/fire",
        json={"client_token": token, "coordinate": "A1"},
    )
    assert fire_resp.status_code == 400


@pytest.mark.asyncio
async def test_ai_game_invalid_token(client):
    create_resp = await client.post(
        "/rooms", json={"mode": "ai", "display_name": "Alice"}
    )
    room_id = create_resp.json()["room_id"]

    fire_resp = await client.post(
        f"/rooms/{room_id}/fire",
        json={"client_token": "bad_token", "coordinate": "A1"},
    )
    assert fire_resp.status_code == 401
