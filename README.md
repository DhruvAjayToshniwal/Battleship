# Battleship

A full-stack Battleship game with a 3D WebGL frontend and intelligent AI opponents.

## Tech Stack

**Backend:** Python 3.13, FastAPI, Pydantic v2, Uvicorn

**Frontend:** React 19, TypeScript, Three.js via React Three Fiber, Framer Motion, TailwindCSS v4, Vite

## Features

- 3D ocean board with animated water (custom GLSL shaders)
- Missile drop animations with explosions and splash effects
- Ship placement with preview, rotation (R key), auto-place, and undo
- Synthesized sound effects (Web Audio API) — no external audio files
- Three AI difficulty levels with distinct algorithms:
  - **Easy** — Random search (~90+ turns)
  - **Medium** — Hunt + Target with checkerboard optimization (~55-65 turns)
  - **Hard** — Probability density heatmap + orientation targeting (~40-45 turns)

## Project Structure

```
backend/
  app/
    api/            # FastAPI route handlers
    engine/
      ai/           # AI strategy modules
        ai_base.py      # Abstract base class
        easy_ai.py      # Random search
        medium_ai.py    # Hunt + Target
        hard_ai.py      # Probability + orientation targeting
        probability.py  # Probability density grid builder
        orientation_target.py  # Orientation detection & targeting
      board.py      # Board logic (placement, shots)
      game_engine.py # Game state machine
      ship.py       # Ship model
    models/         # Pydantic request/response schemas
    services/       # Game service (singleton)
  tests/            # pytest suite (50 tests)

frontend/
  src/
    components/     # React Three Fiber 3D components
    hooks/          # useGame (state management), useSound (audio)
    pages/          # GamePage
    services/       # API client (axios)
```

## Running

### Backend

```bash
cd backend
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --reload-dir app
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/game/*` requests to the backend at `localhost:8000`.

### Tests

```bash
cd backend
python3 -m pytest tests/ -v
```
