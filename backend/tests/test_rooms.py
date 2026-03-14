import pytest


VALID_SHIPS = [
    {"name": "Carrier", "coordinates": ["A1", "A2", "A3", "A4", "A5"]},
    {"name": "Battleship", "coordinates": ["B1", "B2", "B3", "B4"]},
    {"name": "Cruiser", "coordinates": ["C1", "C2", "C3"]},
    {"name": "Submarine", "coordinates": ["D1", "D2", "D3"]},
    {"name": "Destroyer", "coordinates": ["E1", "E2"]},
]


@pytest.mark.asyncio
async def test_create_room_human(client):
    response = await client.post(
        "/rooms", json={"mode": "human", "display_name": "Alice"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["mode"] == "human"
    assert len(data["room_code"]) == 6
    assert data["client_token"]
    assert data["room_id"]
    assert data["player_id"]


@pytest.mark.asyncio
async def test_create_room_ai(client):
    response = await client.post(
        "/rooms", json={"mode": "ai", "display_name": "Alice", "difficulty": "hard"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["mode"] == "ai"
    assert data["difficulty"] == "hard"


@pytest.mark.asyncio
async def test_join_room(client):
    create_resp = await client.post(
        "/rooms", json={"mode": "human", "display_name": "Alice"}
    )
    room_code = create_resp.json()["room_code"]

    join_resp = await client.post(
        "/rooms/join", json={"room_code": room_code, "display_name": "Bob"}
    )
    assert join_resp.status_code == 200
    data = join_resp.json()
    assert data["player_slot"] == "player2"
    assert data["client_token"]


@pytest.mark.asyncio
async def test_join_full_room(client):
    create_resp = await client.post(
        "/rooms", json={"mode": "human", "display_name": "Alice"}
    )
    room_code = create_resp.json()["room_code"]

    await client.post(
        "/rooms/join", json={"room_code": room_code, "display_name": "Bob"}
    )

    third_resp = await client.post(
        "/rooms/join", json={"room_code": room_code, "display_name": "Charlie"}
    )
    assert third_resp.status_code == 400
    assert "full" in third_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_join_nonexistent_room(client):
    resp = await client.post(
        "/rooms/join", json={"room_code": "XXXXXX", "display_name": "Alice"}
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_reconnect(client):
    create_resp = await client.post(
        "/rooms", json={"mode": "human", "display_name": "Alice"}
    )
    data = create_resp.json()
    room_id = data["room_id"]
    token = data["client_token"]

    reconnect_resp = await client.post(
        f"/rooms/{room_id}/reconnect",
        json={"client_token": token},
    )
    assert reconnect_resp.status_code == 200
    rdata = reconnect_resp.json()
    assert rdata["player_slot"] == "player1"
    assert rdata["room_id"] == room_id


@pytest.mark.asyncio
async def test_reconnect_invalid_token(client):
    create_resp = await client.post(
        "/rooms", json={"mode": "human", "display_name": "Alice"}
    )
    room_id = create_resp.json()["room_id"]

    resp = await client.post(
        f"/rooms/{room_id}/reconnect",
        json={"client_token": "invalid_token_here"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_room_state(client):
    create_resp = await client.post(
        "/rooms", json={"mode": "human", "display_name": "Alice"}
    )
    data = create_resp.json()

    resp = await client.get(
        f"/rooms/{data['room_id']}",
        headers={"X-Client-Token": data["client_token"]},
    )
    assert resp.status_code == 200
    rdata = resp.json()
    assert rdata["mode"] == "human"
    assert len(rdata["players"]) == 1
