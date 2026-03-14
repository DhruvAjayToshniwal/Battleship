# Battleship

A full-stack Battleship game with 3D graphics, AI opponents, real-time multiplayer, and desktop packaging.

## Features

- **3D Game Board** — React Three Fiber powered ocean scene with animated ships, explosions, and water effects
- **AI Opponents** — Three difficulty levels (Easy, Medium, Hard) with probability-based targeting
- **Real-Time Multiplayer** — WebSocket-driven PvP with room codes, turn-based combat, and live state sync
- **Refresh Persistence** — Browser refresh mid-game restores your session automatically
- **Anti-Cheat** — Server-authoritative game logic; enemy ship positions hidden until sunk
- **Game History** — Browse completed games with stats, accuracy, and move counts
- **Desktop App** — Tauri v2 packaging with Python sidecar for native desktop builds

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Three.js (React Three Fiber), Framer Motion, Tailwind CSS |
| Backend | Python, FastAPI, SQLAlchemy (async), SQLite |
| Real-time | WebSockets (native FastAPI) |
| Desktop | Tauri v2 with Python sidecar |

## Quick Start

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

Open `http://localhost:5173` in your browser.

### Tests

```bash
cd backend
python -m pytest tests/ -v
```

## How to Play

### vs AI
1. Click **ENGAGE AI** from the main menu
2. Select difficulty and place your ships (or click AUTO DEPLOY)
3. Click **START BATTLE** and take turns firing at the enemy grid
4. Sink all 5 enemy ships to win

### Multiplayer
1. Click **MULTIPLAYER** from the main menu
2. **Create Room** to get a room code, or **Join Room** with a friend's code
3. Both players place ships, then battle in real-time
4. First to sink all opponent ships wins

## Project Structure

```
Battleship/
  backend/
    app/
      api/          # REST + WebSocket endpoints
      core/         # Config, DB, security, WebSocket manager
      engine/       # Game logic (board, ships, AI, adapter)
      models/       # SQLAlchemy models + Pydantic schemas
      repositories/ # Data access layer
      services/     # Business logic (rooms, games, history)
    tests/          # 70 backend tests
  frontend/
    src/
      components/   # HUD, overlays, radar, ship placement
      hooks/        # Game state, battle sequence, real-time, session
      pages/        # Menu, Lobby, Game, History
      scene/        # Three.js 3D scene components
      services/     # API client, WebSocket client, session storage
  docs/             # Architecture, approach, deployment docs
```

## Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./battleship.db` | Database connection string |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | (empty, uses proxy) | Backend API URL |
| `VITE_WS_URL` | (derived from location) | WebSocket URL |

## Documentation

- [Approach & Design Decisions](docs/APPROACH.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
