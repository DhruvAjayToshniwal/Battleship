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

Claude was used as a co-architect and implementation partner throughout the project. The collaboration was iterative — Claude proposed, I evaluated and refined, then Claude implemented.

**Architecture decomposition.** Claude designed the layered backend structure: API routes → services → repositories → engine, with a dedicated adapter layer that serializes the game engine to/from the database. The "transient calculator" pattern (reconstruct engine per request, execute, serialize back) was Claude's proposal — I accepted it because it meant zero changes to the existing engine code. Claude also designed the anti-cheat serialization model, where each player receives a personalized board view with opponent ships filtered out until sunk.

**AI difficulty system.** The three-tier AI was built through iterative prompting. Easy mode was straightforward (random targeting). For Medium, I asked Claude to implement hunt/target logic with a checkerboard optimization for the hunt phase. For Hard, Claude proposed probability density targeting — building a heat map of likely ship placements per turn, weighted by remaining ship sizes — and I refined the orientation detection logic that extends from clustered hits. The Hard AI genuinely plays well; it accounts for ship sizes, adapts to hit patterns, and detects horizontal/vertical orientation from grouped hits.

**3D scene pipeline.** The visual layer was a close collaboration. Claude generated the GLSL ocean shader (Gerstner waves with subsurface scattering, fresnel reflections, foam masks), the procedural ship factory, the 8-mode cinematic camera controller, and the atmospheric sky shader. I directed the art direction — the Sugimoto-inspired monochrome palette, the design token system, the typography choices — and Claude implemented the design system files and restyled every component. The shader code went through several refinement rounds: adjusting wave amplitudes for visual weight, tuning fresnel coefficients, darkening the sky to match the intended mood.

**Testing and auditing.** Claude generated all 70 backend tests, covering game engine logic, coordinate parsing, AI strategy, room lifecycle, multiplayer flow, anti-cheat state filtering, and history queries. I used Claude to run compliance audits against the project spec, which caught missing documentation sections and stale file references.

**Where human judgment mattered most.** Architecture trade-offs (SQLite vs PostgreSQL, REST+WS hybrid vs pure WS), visual direction (what "Sugimoto-inspired" actually means in a game UI), and scope decisions (what to build, what to skip). Claude is excellent at generating correct, structured code from clear specifications. The human role was defining what "correct" means for this project.

## Trade-offs

| Decision | Benefit | Cost |
|----------|---------|------|
| SQLite over PostgreSQL | Zero-config, portable | Single-writer, no concurrent writes at scale |
| State-based routing over React Router | No extra dependency, simpler mental model | Manual navigation state management |
| Engine as transient calculator | No engine code changes needed | DB roundtrip on every operation |
| REST + WebSocket hybrid | REST for mutations (reliable), WS for events (fast) | Two communication channels to maintain |
| localStorage sessions | Simple, no server session store | Limited to same browser, 24h expiry |
