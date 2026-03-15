# Battleship — Approach & Writeup

## What I Built

A full-stack Battleship game with a 3D WebGL frontend, three AI difficulty levels, real-time multiplayer via WebSockets, and refresh persistence. The game is deployed live:

- **Play:** https://battleship-eight-sage.vercel.app
- **API:** https://battleship-x7ep.onrender.com

## How I Approached the Problem

The core architectural decision was making the **backend the single source of truth**. The frontend never computes game outcomes — it sends intents ("fire at B5") and renders whatever the server returns. This makes cheating structurally impossible and means the frontend and backend can evolve independently.

### Starting Point

I started with an existing single-player game engine (`board.py`, `ship.py`, `ai.py`, `game_engine.py`) that handled board logic, ship placement validation, hit detection, and AI targeting. The challenge was: how do I add multiplayer, persistence, and a 3D frontend without rewriting the engine?

### The Adapter Pattern

The key insight was treating the engine as a **transient calculator**. Instead of keeping a long-lived engine instance in memory, I:

1. Store all game state in the database (SQLite via async SQLAlchemy)
2. On each API call, reconstruct a `GameEngine` from the DB snapshot
3. Execute the operation (place ship, fire shot)
4. Serialize the result back to the DB

This meant zero changes to the original engine code. The `GameEngineAdapter` handles all translation between the engine's in-memory objects and the database's JSON columns.

### Backend Architecture

The backend follows a layered structure:

```
API Routes → Services → Repositories → Database
                ↓
           Game Engine (via Adapter)
```

- **API layer** (`app/api/`): REST endpoints for rooms, game actions, history. WebSocket endpoint for real-time events.
- **Service layer** (`app/services/`): Business logic. `GameService` handles multiplayer turns, `AIGameService` handles coupled player+AI turns.
- **Repository layer** (`app/repositories/`): Pure data access — CRUD operations on `GameRoom`, `PlayerSession`, `GameSnapshot`, `MoveHistory`.
- **Engine layer** (`app/engine/`): Original game logic, untouched. Adapter bridges it to the database.

### Anti-Cheat Model

Five layers of server-side protection:

1. **Server-authoritative state** — all game logic runs server-side; the frontend can't compute hit/miss
2. **Board filtering** — the API returns a personalized view per player; opponent ship positions are never sent until the ship is sunk
3. **Turn enforcement** — the server validates it's the requesting player's turn before processing any shot
4. **Token authentication** — 256-bit unguessable tokens (not room codes) control seat ownership
5. **Move audit trail** — every shot is recorded in `MoveHistory` for post-game review

### Multiplayer Synchronization

I chose a **REST + WebSocket hybrid**:

- REST handles mutations (fire, place ships) — these need reliable request/response semantics
- WebSocket handles events (opponent moved, game started, player disconnected) — these need low latency

After each REST mutation, the server broadcasts the result via WebSocket to all room participants. Each player receives a filtered view of the game state.

### AI Difficulty

Three levels with meaningfully different strategies:

- **Easy**: Random targeting from unknown cells
- **Medium**: Hunt/target with checkerboard optimization — random during hunt phase, then targets adjacent cells on hits
- **Hard**: Probability density targeting — builds a heat map each turn by trying all valid placements for remaining ships, then fires at the highest-probability cell. Detects ship orientation from clustered hits.

### Frontend

React + TypeScript + Three.js (via React Three Fiber). The 3D scene includes:

- Gerstner wave ocean shader with Fresnel reflections and foam
- Procedural ship geometry with class-specific hull profiles (carrier, battleship, cruiser, submarine, destroyer)
- Cinematic camera system with mode-based shots (intro, battle overview, missile follow, victory orbit)
- Particle effects for missiles, explosions, splashes, and damage smoke

The frontend uses a hook-based architecture: `useGame` orchestrates game state by delegating to `useGameApiState` (API calls), `useBattleSequence` (turn management), `useShipPlacement` (placement logic), and `useRealtimeRoom` (WebSocket events).

### Refresh Persistence

Sessions survive browser refresh via `localStorage`:

- On room creation/join, a session token is saved locally (24-hour TTL)
- On app load, `useSessionRestore` checks for an active session and calls the reconnect API
- Stale or finished sessions are automatically cleared

## Considerations & Trade-offs

| Decision | Benefit | Cost |
|----------|---------|------|
| SQLite over PostgreSQL | Zero-config, single-file, portable | Single-writer bottleneck at scale |
| Engine as transient calculator | No engine code changes needed | DB roundtrip on every operation |
| REST + WebSocket hybrid | REST for reliability, WS for speed | Two communication channels to maintain |
| State-based routing (no React Router) | No extra dependency, simpler model | Manual navigation management |
| localStorage sessions | Simple, no server session store | Limited to same browser, 24h expiry |
| Procedural ship geometry (no GLTF) | No asset pipeline, instant loading | Less visual detail than 3D models |

### Scalability Notes

On a standard 10×10 board:

| Operation | Complexity |
|-----------|-----------|
| Shot resolution | O(1) — ship positions stored in hash set |
| Ship placement validation | O(s) per ship — checks bounds, alignment, overlap |
| AI targeting (Hard) | O(N² × k) — probability density grid over remaining ships |
| Win check | O(k) — checks each ship's sunk status |

If the board scaled to 100×100, the Hard AI's probability sweep would be the main bottleneck. Mitigations would include spatial indexing or incremental probability updates instead of full rebuilds. The `GameSnapshot` JSON payload grows with N², so sparse representations would be needed. SQLite's single-writer model would also need replacing with PostgreSQL (already a one-line DSN change).

## AI Usage

I used Claude throughout as a coding partner. The workflow: I'd describe what I wanted, Claude would propose an approach, I'd refine or push back, then Claude would implement.

Claude designed the layered backend architecture and the adapter pattern. The AI difficulty system went through several rounds — Easy and Medium were straightforward, but Hard mode's probability density targeting took iteration to get the orientation detection and ship-size weighting right.

The 3D visuals were a close back-and-forth. Claude wrote the GLSL shaders (ocean, sky, board glow), procedural geometry, and camera system. I handled art direction: the dark naval palette, typography choices, and design token system. The shaders took several passes — mostly tuning wave amplitude, Fresnel parameters, and foam visibility.

Claude generated all 70 backend tests. I used it to run audits against the project spec, which caught missing doc sections and stale references.

The places where my own judgment mattered most were architecture trade-offs (SQLite vs Postgres, REST+WS hybrid vs pure WS), visual direction, and scope decisions (what to build vs. what to cut).

## Running Locally

### Backend
```bash
cd backend
pip3 install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Tests
```bash
cd backend
python -m pytest tests/ -v
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Three.js (React Three Fiber), Framer Motion, Tailwind CSS |
| Backend | Python, FastAPI, SQLAlchemy (async), SQLite |
| Real-time | WebSockets (native FastAPI) |
| Deployment | Vercel (frontend), Render (backend) |
