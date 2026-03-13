# PROJECT CONTEXT

We already have a working Battleship web application.

Completed systems:

- FastAPI backend
- Game engine
- AI difficulty levels (easy / medium / hard)
- React frontend
- basic grid UI

Now we want to upgrade the project into a **cinematic naval battle game**.

The new system must add:

- WebGL 3D ocean environment
- ship models
- missile animations
- explosion effects
- cinematic camera movements
- radar scanning effects

The application must still run as a **web app** but should also be compatible
with **Tauri** so it can be packaged as a desktop game.

---

# TECHNOLOGY STACK

Frontend

React
TypeScript
React Three Fiber
Three.js
GSAP
Framer Motion
Theatre.js
TailwindCSS

Backend

FastAPI (already implemented)

---

# ARCHITECTURE

Create the following system.

frontend/

src/

scene/
GameScene.tsx
Ocean.tsx
PlayerFleet.tsx
EnemyFleet.tsx
MissileSystem.tsx
ExplosionSystem.tsx
RadarSweep.tsx
CameraController.tsx

animation/
cinematicTimeline.ts
missileAnimations.ts
explosionAnimations.ts

components/
HUD.tsx
GameControls.tsx
TurnIndicator.tsx

systems/
TargetingSystem.ts
ShipPlacementSystem.ts

---

# 3D SCENE

Create a full WebGL naval scene.

Scene components:

Ocean surface

Use animated shader waves.

Ships

Load GLTF models.

Position them on the board grid.

Lighting

Use:

ambient light
directional sunlight
environment map

Fog

Add light atmospheric fog.

Camera

Perspective camera with orbit controls.

---

# CINEMATIC CAMERA

Use Theatre.js to create camera choreography.

Scenes:

Game start cinematic

Camera flies over ocean
Zoom into player fleet
Rotate toward enemy grid

Missile launch cinematic

Camera zooms toward missile
Follow missile trajectory
Explosion zoom

Victory cinematic

Camera circles surviving fleet
Explosion debris floating

---

# MISSILE SYSTEM

When a player fires:

Create missile mesh.

Animate trajectory using GSAP.

Example

launch point
arc path
impact

Add particle trail.

---

# EXPLOSION SYSTEM

Use particle effects for:

water splash
fireball
smoke

Explosion animation:

impact flash
particle burst
expanding smoke

---

# RADAR EFFECT

Create radar scanning system.

Enemy board receives radar pulse.

Implement:

rotating green sweep
grid glow
target lock animation

---

# HUD SYSTEM

Display overlay UI.

Use Framer Motion animations.

Elements:

Turn indicator
Ships remaining
Difficulty level
Fire confirmation

---

# CAMERA CONTROLS

Allow player camera control.

mouse drag = rotate camera
scroll = zoom
keyboard = cinematic trigger

---

# PERFORMANCE

Maintain 60 FPS.

Use:

instanced meshes
lightweight shaders
optimized particle systems

---

# TAURI COMPATIBILITY

Ensure frontend can run in Tauri.

Do not use browser APIs incompatible with Tauri.

Provide build instructions.

---

# OUTPUT

Provide:

Full project folder structure
Key source files
Example code snippets
Instructions for running the web version
Instructions for building with Tauri

Focus on:

clean architecture
beautiful animations
high performance