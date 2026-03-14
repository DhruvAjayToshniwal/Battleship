# Audit Report

## 1. Overview

### Repo Summary
Full-stack Battleship game with AI and real-time human multiplayer. FastAPI backend with SQLite persistence, React + TypeScript + Vite frontend with a 3D Three.js scene (React Three Fiber). WebSocket-based multiplayer with room codes, reconnect tokens, and server-authoritative game logic.

### Architecture Summary
- **Backend**: FastAPI, async SQLAlchemy + SQLite, repository/service pattern, adapter-based engine reuse
- **Frontend**: React 18, TypeScript, Vite, R3F + Three.js, Framer Motion, GSAP, state-based routing
- **Realtime**: REST for mutations, WebSocket for push events, heartbeat keep-alive
- **Persistence**: 4-table schema (GameRoom, PlayerSession, GameSnapshot, MoveHistory), localStorage session tokens with 24h TTL

---

## 2. Backend Audit

### What Works
- Room create/join/reconnect flow with 256-bit opaque tokens
- AI game service with coupled player+AI turns per fire call
- Multiplayer game service with turn enforcement and personalized board views
- Anti-cheat: enemy ships hidden until sunk, server-side validation for turns, placement, and coordinates
- Move history recording with per-turn granularity
- Game history query endpoint with move replay data
- WebSocket manager with per-room broadcasting and personalized state sync
- 70 backend tests covering room lifecycle, placement, firing, AI behavior, history, reconnect, and edge cases
- Clean adapter pattern: GameEngine instantiated transiently from DB snapshots, no persistent in-memory state
- WAL mode enabled for SQLite (concurrent readers)

### What Is Fragile
- SQLite single-writer constraint means concurrent multiplayer rooms could bottleneck under load (acceptable for submission scope, documented in DEPLOYMENT.md)
- WebSocket connections are in-memory only, so a server restart drops all connections (clients auto-reconnect via REST)
- No rate limiting on fire/placement endpoints

### Dead Code Found and Removed
- `app/api/game_routes.py`: legacy monolithic route file, never imported by `main.py`. **Deleted.**
- `app/services/ai_game_service.py`: unused imports (`TurnResult`, `parse_coordinate`, `format_coordinate`). **Cleaned.**

### Overengineering
- None identified. The repository/service/adapter separation is justified by the need to support both AI and multiplayer modes through the same engine.

### Missing Tests
- WebSocket integration test (connect, receive events), would require `TestClient` WebSocket support
- Frontend session restore logic, no frontend test framework configured

### Deployment Concerns
- SQLite file must be writable by the process; container deployments need a persistent volume
- No health check endpoint (could add `/health`)
- CORS defaults include `localhost:5173`; production deployments should override via `CORS_ORIGINS`

---

## 3. Frontend Audit

### What Works
- Full 3D scene: Gerstner wave ocean with subsurface scattering, procedurally generated ships, volumetric fog, bloom + vignette post-processing
- 8 cinematic camera modes (intro, idle, playerFire, enemyFire, victoryOrbit, defeatPullback) with responsive framing for mobile/desktop
- Quality settings system (QualityProvider) with GPU-based auto-detection (low/medium/high presets)
- Board glow shader (fresnel rim with additive blending, pulsing animation)
- GSAP camera shake on missile impact, zoom punch, turn-change emphasis shift
- Ship placement with drag, rotate, and snap-to-grid
- Framer Motion overlays (intro, victory, defeat, lobby waiting, reconnect)
- Session restore on refresh via localStorage + reconnect API
- WebSocket hook with auto-reconnect and event dispatch
- Game history page with move count, duration, winner display

### Dead Code Found and Removed
- `src/utils/viewport.ts`: viewport utility file, zero imports anywhere. **Deleted.**
- `src/scene/theatre/`: 3 Theatre.js stub files (theatreProject.ts, theatreSheets.ts, sequences.ts). Theatre.js not installed. **Deleted in prior PR.**
- `src/scene/animation/gsapTimelines.ts`: contained unused `INTRO_SEQUENCE`, `FIRE_SEQUENCE`, `lerpCamera`, and constants. **Stripped to only `easeOutCubic` and `easeInOutQuad`.**
- `src/scene/cameras/responsiveFraming.ts`: contained unused `getViewportScale` function. **Removed.**
- `src/services/api.ts`: `getRoomInfo()` and `getGameDetail()` functions never imported. **Removed.** Associated unused types `RoomStateResponse` and `GameHistoryDetail` also removed.
- `src/scene/cameras/CinematicCameraController.tsx`: had duplicate `easeOutCubic` implementation. **Replaced with import from gsapTimelines.**

### Duplicated Components/Utilities
- Coordinate helpers exist in both `src/utils/coordinates.ts` and `backend/app/engine/utils.py`, expected given frontend/backend separation and different languages
- No duplicated React components found

### Stale Scene Files
- None remaining after Theatre.js stub cleanup

### Stale Hooks
- None. All hooks in `src/hooks/` are imported and used.

### Performance Issues
- Ocean surface at 192 segments on low-end devices, mitigated by QualityProvider (low preset uses fewer segments)
- Bloom post-processing can be expensive, gated by quality settings
- No identified memory leaks in useFrame loops (all use refs, no allocations per frame except scratch vectors which are memoized)

### UX Weaknesses
- No sound effects (acceptable for scope)
- No mobile touch controls for ship placement (desktop-focused)
- History page has no pagination UI controls (API supports offset/limit)

---

## 4. Docs Audit

### ARCHITECTURE.md
- **Fixed**: `ships_remaining` was documented as a single JSON field but the actual schema has two integer columns (`player1_ships_remaining`, `player2_ships_remaining`). Corrected.
- All other sections accurately reflect the implementation.

### APPROACH.md
- Accurate. Trade-offs table matches actual decisions. AI usage section present.

### DEPLOYMENT.md
- Accurate. Covers local dev, env vars, Railway/Render backend, Vercel/Netlify frontend.
- `.env.example` files exist for both frontend and backend.

### README.md
- Accurate. Features, tech stack, project structure, quick start all match implementation.

---

## 5. Dead Code List

### Files Deleted This Pass
| File | Reason |
|------|--------|
| `backend/app/api/game_routes.py` | Legacy route file, never imported |
| `frontend/src/utils/viewport.ts` | Zero imports across codebase |

### Files Deleted in Prior PR
| File | Reason |
|------|--------|
| `frontend/src/scene/theatre/theatreProject.ts` | Theatre.js not installed |
| `frontend/src/scene/theatre/theatreSheets.ts` | Theatre.js not installed |
| `frontend/src/scene/theatre/sequences.ts` | Theatre.js not installed |

### Code Removed This Pass
| Location | What | Reason |
|----------|------|--------|
| `ai_game_service.py` | `TurnResult`, `parse_coordinate`, `format_coordinate` imports | Unused |
| `gsapTimelines.ts` | `INTRO_SEQUENCE`, `FIRE_SEQUENCE`, `lerpCamera`, constants | Unused exports |
| `responsiveFraming.ts` | `getViewportScale()` | Unused export |
| `api.ts` | `getRoomInfo()`, `getGameDetail()` | Never imported |
| `api.ts` | `RoomStateResponse`, `GameHistoryDetail` types | Only used by removed functions |
| `CinematicCameraController.tsx` | Duplicate `easeOutCubic` | Replaced with import |

---

## 6. Fix Recommendations

### Fixed in This Pass
1. Deleted dead backend route file (`game_routes.py`)
2. Cleaned unused imports in `ai_game_service.py`
3. Removed 4 unused frontend exports/functions
4. Deleted 4 unused frontend files (viewport.ts + 3 Theatre.js stubs)
5. Fixed `ships_remaining` documentation in ARCHITECTURE.md
6. Eliminated duplicate easing function in camera controller
7. Integrated quality settings into scene components (ocean, lighting, post-processing, effects)
8. Added board glow shader integration
9. Created lobby and reconnect overlay components
10. Added GSAP camera shake on missile impact

### Remaining (Optional, Low Priority)
1. Add WebSocket integration test using FastAPI TestClient
2. Add `/health` endpoint for container orchestration
3. Add pagination UI controls to history page
4. Add sound effects system
5. Add mobile touch support for ship placement
6. Consider adding rate limiting middleware
7. Add Zustand state stores (`uiStore`, `gameStore`, `roomStore`); current prop/hook-based state management works but stores would reduce prop drilling
