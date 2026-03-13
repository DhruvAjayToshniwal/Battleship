# PROJECT: Advanced Battleship Web Game

You are a senior full-stack engineer and game developer.

Generate a **complete full-stack Battleship game** with the following stack:

Backend
- Python
- FastAPI
- Clean architecture
- Pure game engine logic
- Smart algorithmic opponent (no ML required)

Frontend
- React
- TypeScript
- TailwindCSS
- React Three Fiber (WebGL / Three.js)
- Framer Motion animations

The game must look like a **modern polished web game** with smooth animations and excellent UI.

The output must include:

- complete backend code
- complete frontend code
- folder structure
- setup instructions
- explanations where useful

The result should feel like a **professional indie web game**, not a basic coding exercise.

---

# GAME RULES

Implement the classic Battleship rules:

Board
- 10x10 grid
- coordinates A1–J10

Ships
- Carrier (5)
- Battleship (4)
- Cruiser (3)
- Submarine (3)
- Destroyer (2)

Ships must:
- be horizontal or vertical
- not overlap
- stay inside grid

Gameplay
- Player vs computer opponent
- Players take turns firing coordinates
- Response can be:
  - hit
  - miss
  - sunk
- Game ends when all ships sunk

---

# PROJECT STRUCTURE

Create a full monorepo.


battleship/
backend/
app/
main.py
api/
game_routes.py
engine/
board.py
ship.py
game_engine.py
ai_strategy.py
models/
schemas.py
services/
game_service.py
tests/

frontend/
src/
components/
Board3D.tsx
Ocean.tsx
Grid.tsx
Cell.tsx
Ship.tsx
Explosion.tsx
Radar.tsx
GameHUD.tsx

pages/
  GamePage.tsx

hooks/
  useGame.ts

services/
  api.ts

styles/
  globals.css

BACKEND REQUIREMENTS

Use FastAPI.

Important rule:

Game logic must be pure Python and separated from the API.

Game Engine responsibilities:

GameEngine

start_game()

place_ships()

fire_shot()

check_hit()

check_sunk()

check_win()

ai_turn()

Board class

maintain grid

track ships

validate placement

Ship class
fields:

name
size
coordinates
hits

GameState
stores:

player_board
ai_board
player_shots
ai_shots
turn
game_status
SMART OPPONENT (NO ML)

Implement a Hunt + Target strategy

Hunt Mode

fire shots in checkerboard pattern

Example:

X . X . X
. X . X .
X . X . X

Target Mode

when hit detected

search adjacent cells

Optional advanced strategy

Probability heatmap:

generate possible ship placements

eliminate impossible ones

score grid cells

shoot highest probability

API ENDPOINTS

POST /game/start

Returns new game.

POST /game/place-ships

POST /game/fire

Example request

{
  "coordinate": "B7"
}

Response

{
  "result": "hit",
  "ship": "cruiser",
  "game_over": false
}

GET /game/state

FRONTEND REQUIREMENTS

Create a beautiful animated UI.

Use:

React + TypeScript
TailwindCSS
React Three Fiber (WebGL)
Framer Motion

VISUAL DESIGN

Theme: naval command center

Color palette:

Ocean background: #0f172a
Grid lines: #1e293b
Miss marker: #38bdf8
Hit marker: #ef4444
Ships: #64748b
WEBGL SCENE

Render a 3D ocean board using React Three Fiber.

Scene contains:

Ocean surface
Player ships
Enemy radar grid
Missile shots
Explosion particles

Camera

angled view

smooth movement

Lighting

soft ocean lighting

glowing radar grid

ANIMATIONS

Use Framer Motion and R3F.

Hit animation

missile drop
flash
explosion particles

Miss animation

missile
water splash
ripple

Radar sweep animation

rotating scan beam

Ship sinking animation

explosion
fade ship
water smoke
USER INTERACTIONS

Player can:

Place ships

drag ship onto grid

rotate ship with "R"

Fire shots

click enemy grid

Camera controls

mouse drag = rotate camera
scroll = zoom
GAME HUD

Display:

Turn indicator
Ships remaining
Shots fired
Game status
Restart button
REACT STATE MANAGEMENT

Create custom hook

useGame()

Handles:

startGame()
placeShips()
fireShot()
getGameState()

Use Axios for API calls.

BACKEND TESTS

Include unit tests for:

ship placement

hit detection

win condition

RUNNING THE PROJECT

Backend

pip install fastapi uvicorn
uvicorn app.main:app --reload

Frontend

npm install
npm run dev
CODE QUALITY

Use:

TypeScript types

Python type hints

clean architecture

modular code

readable naming

Focus on maintainability and clarity.

BONUS FEATURES

If possible include:

sound effects

difficulty levels

animated radar sweep

replay option

scoreboard

GOAL

The result should feel like:

an interactive 3D naval battle game

with clean code and smooth gameplay.

Generate the entire project codebase.