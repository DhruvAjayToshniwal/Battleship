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

## AI Usage

Claude was used extensively throughout development for:
- Architecture planning and system design
- Implementation of all backend services, repositories, and API routes
- Frontend hooks, pages, and component modifications
- Test writing and debugging
- Documentation

## Trade-offs

| Decision | Benefit | Cost |
|----------|---------|------|
| SQLite over PostgreSQL | Zero-config, portable | Single-writer, no concurrent writes at scale |
| State-based routing over React Router | No extra dependency, works with Tauri | Manual navigation state management |
| Engine as transient calculator | No engine code changes needed | DB roundtrip on every operation |
| REST + WebSocket hybrid | REST for mutations (reliable), WS for events (fast) | Two communication channels to maintain |
| localStorage sessions | Simple, no server session store | Limited to same browser, 24h expiry |
