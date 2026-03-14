# ROLE

You are a principal full-stack engineer, realtime systems engineer, game architect, and product-minded startup builder.

You are working on an existing Battleship codebase that already has:
- FastAPI backend
- Python game engine
- AI difficulty levels
- React frontend
- a playable UI
- some 3D / visual work already attempted

You must now upgrade the system to satisfy a real engineering work trial.

This is no longer just a toy frontend exercise.
This must become a **deployed, end-to-end product**.

Your mission is to make the project fully satisfy these requirements:

1. Feature-complete Battleship
2. Single-player vs AI
3. Multiplayer vs Human in real time
4. Room creation + room code join flow
5. Max 2 players per room
6. Refresh persistence mid-game
7. Completed game history stored for later querying
8. Publicly deployable frontend and backend
9. Secure enough to discuss cheating prevention intelligently
10. Clean architecture and a repo writeup that explains approach and AI usage

Use all AI-assisted engineering you want, but produce clean code and good system design.

---

# PRODUCT REQUIREMENTS

## Core Gameplay
Implement a complete, rules-correct Battleship game:

- 10x10 board
- Ship placement phase
- Ships:
  - Carrier (5)
  - Battleship (4)
  - Cruiser (3)
  - Submarine (3)
  - Destroyer (2)
- Placement validation
- Rotate ships before confirming
- Firing phase
- hit / miss / sunk feedback
- announce sunk ship type
- win detection
- rematch or return to menu

## Game Modes

### 1. Single-player vs AI
- AI places ships randomly
- AI move logic must be at least moderately intelligent
- Existing AI system can be reused and improved

### 2. Multiplayer vs Human
- Two players in separate browser windows
- Real-time updates without refresh
- One player creates a room
- Another player joins using a room code
- Max 2 players in a room
- If a third person tries to join, deny access
- Both players see updates instantly

## Persistence
- Refreshing the page mid-game must restore the current game state
- At minimum this must fully work for multiplayer
- Completed games must be stored with:
  - moves
  - outcome
  - timestamps
  - metadata useful for later query / replay

## Hosting
- The app must be deployable to a public URL
- Frontend and backend must communicate correctly in deployed environments
- API base URL and WebSocket URL must be env-configurable

## Writeup
In the repo, include a markdown writeup explaining:
- architecture
- tradeoffs
- storage choice
- anti-cheat considerations
- scalability considerations
- how AI tools were used

---

# KEY SYSTEM DESIGN DECISIONS

You must build this as a **real deployable app**.

Use this architecture unless you have a clearly better alternative:

Frontend
- React
- TypeScript
- Vite
- existing UI / scene code reused where sensible

Backend
- FastAPI
- existing game engine reused where sensible
- REST for normal operations
- WebSockets for realtime multiplayer updates

Persistence
- Use a real database, not in-memory state only
- Prefer PostgreSQL if available
- SQLite is acceptable only if you justify it carefully for the work-trial scope
- Use SQLAlchemy or SQLModel or another clean ORM layer
- Persist games, players, moves, room state, and reconnectable session state

Realtime
- WebSocket channel per room
- Backend is source of truth
- Clients never directly trust each other
- Broadcast state updates to both connected players

Session / reconnect
- Persist player seat assignment
- Persist room state and game state
- Refreshing a browser should rehydrate the correct player and room if a valid local session token / player token exists

Deployment
- Frontend as a Vite app with env-configured API/WS URLs
- Backend deployed separately
- CORS configured correctly
- WebSocket origin / connection assumptions documented

Do not keep game state only in memory.
Use persistence from the start.

---

# FASTAPI / REALTIME NOTES

FastAPI supports WebSockets and React clients can connect to them using browser WebSocket utilities. Use that for the multiplayer room sync layer. Build a proper room connection manager and reconnection flow. Do not fake realtime with polling unless there is a very strong reason. The frontend should still use normal REST endpoints for initial room creation, joining, fetching history, etc. ([FastAPI WebSockets docs](https://fastapi.tiangolo.com/advanced/websockets/))

---

# FRONTEND/BACKEND DEPLOYMENT NOTES

The frontend must read environment variables for:
- API base URL
- WebSocket base URL

The backend must expose its origin configuration through environment variables.

The app must be easy to deploy to something like:
- frontend on Vercel / Netlify / static host
- backend on Railway / Render / Fly / similar
- database managed separately

Do not hardcode localhost URLs.
Vite supports static frontend deployment and environment-driven configuration, so keep the frontend cleanly separated from the API runtime. ([Vite static deploy docs](https://vite.dev/guide/static-deploy.html))

---

# DATA MODEL REQUIREMENTS

Design persistent models for at least:

## GameRoom
- id
- room_code
- mode (`ai` or `human`)
- status (`waiting`, `placement`, `active`, `finished`, `abandoned`)
- created_at
- updated_at
- winner_player_id nullable
- rematch_of nullable if useful

## PlayerSession
- id
- room_id
- player_slot (`player1`, `player2`, maybe `ai`)
- display_name optional
- client_token / reconnect_token
- connected boolean
- created_at
- updated_at

## GameSnapshot or GameState
Persist the authoritative game state:
- room_id
- current_turn
- player1 board state
- player2 board state / AI board state
- placement complete flags
- sunk ships state
- turn number
- game status

You may store structured board state as JSON if that is simplest, but do it cleanly.

## MoveHistory
- id
- room_id
- turn_number
- actor_player_id
- coordinate
- result
- sunk_ship nullable
- created_at

## CompletedGame
If separate from room:
- room_id
- mode
- outcome
- duration
- timestamps
- summary metadata

You may simplify if your schema is elegant, but all required behavior must be supported.

---

# CHEATING / TRUST MODEL

Design explicitly against cheating.

You must include anti-cheat considerations in both code and writeup.

Required principles:
- server is source of truth
- enemy ship positions are never sent to the wrong client
- move legality validated server-side
- turn order validated server-side
- placement legality validated server-side
- room seat ownership validated server-side
- player reconnect token is unguessable
- room code alone should not grant control of another player’s seat

Optional but good:
- separate public/private game state serializers
- audit trail from MoveHistory
- signed player session token or opaque reconnect token
- game state versioning for race prevention

---

# SCALABILITY / COMPLEXITY CONSIDERATIONS

Include design notes for:
- how board operations scale if board size grows significantly
- complexity of AI move logic
- complexity of move validation
- implications of storing full move history
- handling many simultaneous rooms
- WebSocket connection manager design
- possible future use of Redis pub/sub if horizontally scaled

You do not need to implement massive-scale infra, but design the interfaces so the path is clear.

---

# REQUIRED FEATURES TO IMPLEMENT

## A. Main Menu / Entry Flow
- Play vs AI
- Play vs Human
- View recent / completed games (at least basic history page)
- Enter display name if useful
- Clean entry UX

## B. Multiplayer Room Flow
### Create room
- Player selects human multiplayer
- Backend creates room_code
- Assign creator to player1
- Returns room info + player reconnect token
- Show room code to user

### Join room
- Player enters room code
- Backend checks capacity
- Assigns player2
- Returns room info + reconnect token
- If room full, show friendly error

### Waiting room
- Show both seat states
- Show when opponent joins
- Allow both to proceed into placement phase

## C. Placement Phase
For human multiplayer:
- Each player places their own fleet privately
- Opponent must not see placement
- Server persists placement state
- Refresh restores placement view
- Once both are ready, transition to active play

For AI:
- player places fleet
- AI fleet auto-generated
- state persisted as well if practical

## D. Active Gameplay
- Real-time update both clients after every move
- Show your board with incoming hits/misses
- Show enemy board with your shots only
- Enforce turn order
- Show hit / miss / sunk / win states
- Refresh restores exact current state

## E. Game End
- Winner announced
- Store completed game
- Allow rematch or back to menu
- Rematch behavior should be clearly designed
- If rematch is too large, implement back-to-menu and justify

## F. History
At least one basic endpoint/page to query completed games later:
- room code or id
- timestamps
- winner
- mode
- moves count
- maybe move list / replay metadata

---

# API DESIGN

Build a clean API with REST + WebSocket.

## Suggested REST endpoints

### Session / Room
- `POST /rooms` -> create human room
- `POST /rooms/join` -> join room by code
- `GET /rooms/{room_id}` -> get room summary for authenticated seat
- `POST /rooms/{room_id}/reconnect` -> reconnect with player token
- `POST /rooms/{room_id}/ready` -> mark ready / placement ready if needed

### AI mode
- `POST /games/ai` -> create AI game
- `POST /games/ai/{room_id}/place-ships`
- `POST /games/ai/{room_id}/fire`
- `GET /games/ai/{room_id}`

### Shared gameplay
- `POST /rooms/{room_id}/place-ships`
- `POST /rooms/{room_id}/fire`
- `GET /rooms/{room_id}/state`
- `GET /games/history`
- `GET /games/history/{room_id}`

## WebSocket
- `GET /ws/rooms/{room_id}?token=...`

WebSocket should:
- authenticate seat
- join connection manager
- receive room/game events
- push updates on:
  - player joined
  - placement ready
  - game started
  - shot fired
  - turn changed
  - game finished
  - reconnect state sync

You may define a proper event schema:
- `room.updated`
- `game.state`
- `game.move`
- `game.finished`
- `error`

---

# FRONTEND STATE / UX REQUIREMENTS

Refactor or extend frontend state so it supports:
- menu mode
- room create/join flow
- waiting room
- AI game flow
- human multiplayer flow
- reconnect-on-refresh
- history page
- websocket-driven updates
- optimistic UI only where safe
- server-truth rendering

Store a reconnect token locally (e.g. localStorage) keyed by room id or active session.
On app load:
- if an active session token exists
- attempt rehydrate / reconnect
- restore room and role

Do not lose mid-game state on refresh.

---

# IMPLEMENTATION DETAILS

## Board state serialization
Design a clean server-side representation for:
- ship positions
- hits
- misses
- sunk state
- current turn

Use public/private serializers:
- private board = full self board
- public enemy board = only visible shot results, never hidden ship positions

## AI integration
Reuse the existing AI logic for AI games.
Ensure AI state is persisted enough that a refresh does not corrupt the game.

## Reconnect tokens
Generate secure opaque tokens.
Do not use guessable player indexes alone.

## Room codes
Use short human-readable codes:
- e.g. 6 chars uppercase alphanumeric
- ensure uniqueness

## Validation
Every action must be validated server-side.

---

# REPO WRITEUP REQUIREMENT

In the repo, generate:
- `APPROACH.md`

It must explain:
1. architecture
2. storage choice
3. multiplayer sync design
4. anti-cheat model
5. refresh persistence
6. deployment strategy
7. scalability notes
8. AI usage during development
9. tradeoffs and shortcuts if any

Also generate:
- `DEPLOYMENT.md`
- `ARCHITECTURE.md`

---

# TESTING REQUIREMENTS

Add or improve tests for:

## Backend
- room creation
- join flow
- max 2 players
- placement validation
- turn order enforcement
- multiplayer fire flow
- win detection
- reconnect flow
- history persistence
- public/private board serialization
- websocket event flow at least minimally if feasible

## Frontend
At least some tests for:
- reconnect token handling
- room code UX logic
- state restoration helpers

If frontend test coverage is too large, prioritize backend correctness and document frontend tradeoff.

---

# MIGRATION STRATEGY

You are working in an existing repo.
Do not unnecessarily delete working code.

Preferred strategy:
1. preserve and reuse existing core engine
2. introduce persistence layer
3. introduce room/session models
4. introduce websocket manager
5. adapt frontend to new state flows
6. keep AI mode and human mode sharing as much code as possible

---

# REQUIRED PROJECT STRUCTURE

Refactor or expand toward something like:

backend/
  app/
    main.py
    core/
      config.py
      security.py
      db.py
      websocket_manager.py
    api/
      rooms.py
      games.py
      history.py
      ws.py
    engine/
      ...
    models/
      db_models.py
      schemas.py
    repositories/
      rooms.py
      games.py
      history.py
    services/
      room_service.py
      game_service.py
      ai_game_service.py
      history_service.py
    tests/
      ...

frontend/
  src/
    pages/
      MenuPage.tsx
      LobbyPage.tsx
      GamePage.tsx
      HistoryPage.tsx
    hooks/
      useGame.ts
      useRealtimeRoom.ts
      useSessionRestore.ts
    services/
      api.ts
      ws.ts
      session.ts
    state/
      ...
    components/
      ...
    utils/
      ...

docs/
  APPROACH.md
  ARCHITECTURE.md
  DEPLOYMENT.md

---

# REQUIRED OUTPUT FORMAT

When responding, do it in this order:

## 1. Architecture overview
Explain the final system design

## 2. Data model design
Show DB schema / ORM models

## 3. Backend structure and key files
Generate or refactor real code for:
- config/db setup
- DB models
- core schemas
- repositories
- services
- REST endpoints
- websocket manager
- websocket route
- persistence / reconnect logic

## 4. Frontend structure and key files
Generate or refactor real code for:
- API client
- websocket client
- room create/join flow
- reconnect/session restore
- GamePage integration for both AI and multiplayer
- history page
- state management

## 5. Storage and anti-cheat notes
Explain and implement the trust boundary

## 6. Deployment setup
Generate:
- backend env config
- frontend env config
- sample `.env.example`
- deployment notes for public hosting

## 7. Docs
Generate:
- `APPROACH.md`
- `ARCHITECTURE.md`
- `DEPLOYMENT.md`

## 8. Tests
Generate critical backend tests and any practical frontend tests

## 9. Migration plan
Exactly how to apply this on top of the current repo

Do not give a shallow answer.
Do not just describe.
Generate the actual code and file contents.
If too large, continue in clearly labeled parts without reducing ambition.

Start now.