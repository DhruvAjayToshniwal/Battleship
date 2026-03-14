# Approach

## Overview

This document explains the design decisions and trade-offs made during the Battleship full-stack upgrade from a single-player prototype to a production-grade multiplayer application.

## Architecture Philosophy

The system follows a **server-authoritative** model where all game logic runs on the backend. The frontend is a presentation layer that sends actions and renders state received from the server. This prevents cheating and ensures consistency across clients.

## Storage

**SQLite with async SQLAlchemy** was chosen for persistence:
- Zero-config deployment (single file database)
- Async via `aiosqlite` for non-blocking I/O within FastAPI
- One-line DSN change to migrate to PostgreSQL for production scale
- Four tables: `GameRoom`, `PlayerSession`, `GameSnapshot`, `MoveHistory`

## Engine Reuse via Adapter Pattern

The existing `GameEngine` (board logic, ship placement, hit detection, AI strategies) is reused without modification. An **adapter layer** serializes/deserializes engine state to/from the database:

1. Load snapshot from DB
2. Reconstruct `GameEngine` instance
3. Execute operation (place ship, fire shot)
4. Serialize back to DB

This "transient calculator" approach means the engine holds no persistent state and can be used identically for AI and multiplayer games.

## Multiplayer Synchronization

Real-time multiplayer uses **WebSockets** for low-latency event delivery:
- REST endpoints handle mutations (fire, place ships)
- After each mutation, the server broadcasts events via WebSocket to all room participants
- Each player receives a **personalized view** of the game state (anti-cheat filtering)

### WebSocket Event Protocol

Server-to-client events:
- `room.player_joined` - opponent connected
- `game.placement_ready` - opponent placed ships
- `game.started` - both players ready, game begins
- `game.move` - shot result broadcast
- `game.state` - full state sync (personalized per player)
- `game.finished` - game over with winner
- `player.disconnected` / `player.reconnected` - presence events

Client-to-server:
- `game.fire` - fire a shot
- `heartbeat` - keep connection alive

## Anti-Cheat Model

1. **Server-authoritative state**: All game logic runs server-side
2. **Board filtering**: Enemy ship positions are never sent to the client until the ship is sunk
3. **Turn enforcement**: Server validates it's the requesting player's turn before processing
4. **Token authentication**: 256-bit unguessable tokens (not room codes) control seat ownership
5. **Move audit trail**: Every shot is recorded in `MoveHistory` for post-game review

## Refresh Persistence

Sessions survive browser refresh via `localStorage`:
- On room creation/join, a session token is saved locally (24-hour TTL)
- On app load, `useSessionRestore` checks for an active session
- If found, it calls the reconnect API to validate and restore state
- Stale or finished sessions are automatically cleared

## Runtime Complexity & Scalability

On a standard 10×10 board with 5 ships:

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Shot resolution | O(1) average | Ship occupancy stored in a hash set; lookup is constant time |
| Placement validation | O(s) per ship | s = ship size; checks bounds, alignment, and overlap against existing placements |
| AI targeting (Easy) | O(1) amortized | Random selection from unknown cells |
| AI targeting (Medium) | O(1) amortized | Hunt/target with checkerboard pattern; adjacent cell queue |
| AI targeting (Hard) | O(N² × k) | Builds probability density grid: for each of k remaining ships, tries all valid placements across N×N cells |
| Win check | O(k) | Checks `is_sunk` on each of k ships |
| WebSocket broadcast | O(p) | p = players in room; effectively O(2) |
| Move history write | O(1) | Single row insert per shot |

**If the board scaled much larger** (e.g., 50×50 or 100×100):

- The Hard AI's probability grid becomes the main bottleneck. On a 100×100 board with more ships, the O(N² × k) sweep per turn could take noticeable time. Mitigations: spatial indexing, sampling-based approximation, or precomputed probability updates instead of full rebuilds.
- Board serialization grows with N². The `GameSnapshot` JSON payload increases proportionally. For very large boards, a sparse representation (only occupied/hit cells) would be more efficient than a full grid.
- Move history grows linearly with the number of shots fired. On a 100×100 board, a full game could produce ~10,000 moves. This is still manageable for SQLite but would benefit from batch inserts and indexed queries.
- The WebSocket broadcast payload grows with board size (full state sync). Delta-based updates (sending only what changed) would be necessary at scale.
- SQLite's single-writer model becomes a bottleneck with many concurrent games. The documented PostgreSQL migration path (one-line DSN change) addresses this.

## AI Usage

I used Claude throughout the project as a coding partner. The workflow was pretty consistent: I'd describe what I wanted, Claude would propose an approach, I'd push back or refine, and then Claude would implement. It was genuinely collaborative, not just "generate code and paste."

For the backend architecture, Claude came up with the layered structure (API routes, services, repositories, engine) and the adapter pattern that lets the game engine serialize to and from the database. The key insight was treating the engine as a transient calculator: reconstruct it from a DB snapshot, run the operation, serialize back. That meant I didn't have to touch any of the original engine code at all. Claude also designed the anti-cheat model where each player gets a filtered view of the board with opponent ships hidden until they're sunk.

The AI difficulty system came together through a few rounds of iteration. Easy mode is just random targeting, nothing fancy. For Medium, I wanted hunt/target logic with a checkerboard optimization during the hunt phase, and Claude implemented that. Hard mode was more interesting: Claude proposed probability density targeting, where it builds a heat map of likely ship placements each turn weighted by remaining ship sizes. I refined the orientation detection that extends from clustered hits. The Hard AI actually plays quite well; it tracks ship sizes, adapts to hit patterns, and figures out whether a ship is horizontal or vertical from grouped hits.

The 3D visuals were a close back-and-forth. Claude wrote the GLSL ocean shader (Gerstner waves, subsurface scattering, fresnel reflections, foam), the procedural ship geometry, the cinematic camera controller, and the sky shader. I handled art direction: the Sugimoto-inspired monochrome palette, the design token system, typography choices. The shaders took several passes to get right, mostly around wave amplitude, fresnel tuning, and getting the sky dark enough for the mood I was going for.

Claude generated all 70 backend tests covering engine logic, coordinate parsing, AI strategy, room lifecycle, multiplayer flow, anti-cheat filtering, and history queries. I also used it to run audits against the project spec, which caught a few missing doc sections and stale references.

The places where my own judgment mattered most were the architecture trade-offs (SQLite vs Postgres, REST+WS hybrid vs pure WS), visual direction (translating "Sugimoto-inspired" into actual UI decisions), and scope (what to build, what to cut). Claude is great at producing correct code from clear specs. My job was deciding what "correct" meant.

## Trade-offs

| Decision | Benefit | Cost |
|----------|---------|------|
| SQLite over PostgreSQL | Zero-config, portable | Single-writer, no concurrent writes at scale |
| State-based routing over React Router | No extra dependency, simpler mental model | Manual navigation state management |
| Engine as transient calculator | No engine code changes needed | DB roundtrip on every operation |
| REST + WebSocket hybrid | REST for mutations (reliable), WS for events (fast) | Two communication channels to maintain |
| localStorage sessions | Simple, no server session store | Limited to same browser, 24h expiry |
