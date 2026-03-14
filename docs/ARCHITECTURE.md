# Architecture

## System Diagram

```
+------------------+         +-------------------+
|    Frontend      |  HTTP   |     Backend       |
|  React + Vite    | ------> |  FastAPI + SQLite  |
|  Three.js (3D)   | <------ |                   |
|  Framer Motion   |   WS    |  GameEngine       |
+------------------+ <-----> |  (reused via      |
                              |   adapter)        |
                              +-------------------+
                                      |
                              +-------------------+
                              |   SQLite DB       |
                              |  (battleship.db)  |
                              +-------------------+
```

## Backend Layers

### API Layer (`app/api/`)
- `rooms.py` - Room CRUD, join, reconnect
- `games.py` - Ship placement, firing, state queries
- `history.py` - Completed game history
- `ws.py` - WebSocket endpoint for real-time events

### Service Layer (`app/services/`)
- `RoomService` - Room lifecycle management (singleton)
- `GameService` - Multiplayer game logic (singleton)
- `AIGameService` - AI game logic with coupled player+AI turns (singleton)
- `HistoryService` - Game history queries (singleton)

### Repository Layer (`app/repositories/`)
- `RoomRepository` - GameRoom and PlayerSession CRUD
- `GameRepository` - GameSnapshot CRUD
- `HistoryRepository` - MoveHistory recording and queries

### Engine Layer (`app/engine/`)
- `adapter.py` - Serialization bridge between GameEngine and database
- Existing engine code (`board.py`, `ship.py`, `ai.py`, `game_engine.py`) unchanged

### Core Layer (`app/core/`)
- `config.py` - Pydantic Settings with environment variables
- `db.py` - Async SQLAlchemy engine and session management
- `security.py` - Token and room code generation
- `websocket_manager.py` - WebSocket connection registry

## Data Model

### GameRoom
- `id` (UUID PK)
- `room_code` (unique 6-char)
- `mode` (ai | human)
- `status` (waiting | placement | active | finished | abandoned)
- `winner_player_id` (nullable FK)

### PlayerSession
- `id` (UUID PK)
- `room_id` (FK -> GameRoom)
- `player_slot` (player1 | player2)
- `display_name`
- `client_token` (unique, 256-bit)
- `connected` (boolean)

### GameSnapshot
- `room_id` (unique FK -> GameRoom)
- `current_turn` (player_id)
- `player1_board` / `player2_board` (JSON)
- `player1_placed` / `player2_placed` (boolean)
- `player1_shots` / `player2_shots` (JSON)
- `player1_ships_remaining` / `player2_ships_remaining` (int)
- `game_status`
- `difficulty` (for AI games)
- `ai_strategy_state` (JSON, for AI games)

### MoveHistory
- `room_id` (FK -> GameRoom)
- `turn_number`
- `actor_player_id`
- `coordinate` (e.g., "A5")
- `result` (hit | miss | sunk)
- `sunk_ship` (nullable ship name)

## Frontend Architecture

### Pages (state-based routing)
- `MenuPage` - Main menu (AI, Multiplayer, History)
- `LobbyPage` - Room creation/joining
- `GamePage` - 3D game board with HUD overlays
- `HistoryPage` - Completed game list

### Key Hooks
- `useGame` - Orchestrates game state, delegates to sub-hooks
- `useBattleSequence` - Turn management, shot processing, animations
- `useGameApiState` - API communication and state sync
- `useShipPlacement` - Ship placement logic
- `useRealtimeRoom` - WebSocket event bridge
- `useSessionRestore` - Refresh persistence

### Services
- `api.ts` - REST API client (room, game, history endpoints)
- `ws.ts` - WebSocket client with auto-reconnect
- `session.ts` - localStorage session management

## WebSocket Protocol

All messages are JSON with a `type` field:

```json
{ "type": "game.move", "data": { "actor_player_id": "...", "shot": {...}, "next_turn": "..." } }
```

Connection flow:
1. Client connects to `/ws/rooms/{room_id}?token={client_token}`
2. Server validates token, registers connection
3. Server sends current `game.state` to the connecting player
4. Server broadcasts `player.reconnected` to other players
5. Client sends `heartbeat` periodically
6. On disconnect, server broadcasts `player.disconnected`
