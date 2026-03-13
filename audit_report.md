# SYSTEM AUDIT REPORT

**Project:** Battleship - Cinematic Naval Battle Game
**Date:** 2026-03-13
**Auditor:** Principal Engineer Review
**Codebase:** ~1,385 LOC backend, ~3,039 LOC frontend, 50 tests

---

## 1 Project Overview

A full-stack Battleship game with a 3D WebGL frontend and three-tier AI opponent.

**Backend:** Python 3.13, FastAPI, Pydantic v2, Uvicorn. In-memory game state with singleton service pattern. Three AI difficulty levels implemented as a strategy pattern with abstract base class.

**Frontend:** React 19, TypeScript, React Three Fiber (R3F), Three.js 0.183, Framer Motion, TailwindCSS v4, Vite 6. Custom GLSL shaders for ocean and radar effects. Web Audio API for synthesized sound. Cinematic camera controller with state-driven transitions.

**Architecture style:** Monolithic backend with layered separation (routes -> service -> engine). Frontend is a single-page app with a single Canvas scene containing two board instances.

---

## 2 Repository Structure

```
Battleship/
  backend/
    app/
      api/game_routes.py          # FastAPI route handlers
      engine/
        ai/                       # AI strategy module (5 files)
          ai_base.py              # Abstract base
          easy_ai.py              # Random
          medium_ai.py            # Hunt+Target
          hard_ai.py              # Probability heatmap
          probability.py          # Grid builder
          orientation_target.py   # Line detection
        board.py                  # Board + placement logic
        game_engine.py            # Game state machine
        ship.py                   # Ship entity
      models/schemas.py           # Pydantic request/response models
      services/game_service.py    # Singleton service layer
      main.py                     # FastAPI app creation
    tests/test_game.py            # 50 pytest tests
  frontend/
    src/
      components/                 # 14 React/R3F components
      hooks/                      # useGame, useSound
      pages/GamePage.tsx          # Main page
      services/api.ts             # Axios API client
```

**Assessment:** Clean separation. Backend layers are well-defined. Frontend could benefit from separating 3D scene components from UI overlay components into distinct directories (e.g., `scene/` vs `ui/`), but is acceptable at current scale.

**Issue:** No GSAP or Theatre.js is actually used despite plan.md listing them. Animations are implemented natively with `useFrame` and Framer Motion, which is pragmatically correct — avoids unnecessary bundle weight.

---

## 3 Backend Audit

### 3.1 FastAPI Architecture

The backend is minimal and correct for a game server. Single router, single service, clean dependency chain.

**Issue B-01 (HIGH): CORS allows all origins with credentials**
File: `app/main.py:10`
```python
allow_origins=["*"],
allow_credentials=True,
```
`allow_origins=["*"]` with `allow_credentials=True` is a security misconfiguration. Browsers will reject credentialed requests to `*` origins, but the intent signals carelessness. For a local dev game this is acceptable; for production deployment, restrict origins.

**Recommendation:** Use `allow_origins=["http://localhost:5173"]` in development, environment-variable-driven in production.

### 3.2 Separation of Concerns

Good layering: routes handle HTTP, service handles orchestration, engine handles game logic. The service correctly translates between Pydantic models and internal dicts.

**Issue B-02 (LOW): Redundant coordinate passing in Ship/Board**
`Ship.__init__` already stores coordinates, but `Board.place_ship` also takes coordinates as a parameter. Both must match, but nothing enforces this besides the size check. The board could just use `ship.coordinates`.

### 3.3 Game Engine

`game_engine.py` at 226 lines manages the full lifecycle cleanly. `parse_coordinate` / `format_coordinate` are correct and well-tested (roundtrip test covers all 100 cells).

**Issue B-03 (MEDIUM): `build_board_state` is called per AI turn but constructs a fresh 10x10 grid**
File: `app/engine/game_engine.py:98-104`
This allocates a new list-of-lists each time. For a 10x10 board this is negligible, but the AI's `choose_move` method accepts this grid then largely ignores it (the AI tracks its own state internally). The `board_state` parameter exists for interface compliance but creates unnecessary coupling.

### 3.4 Singleton Pattern

**Issue B-04 (MEDIUM): Non-thread-safe singleton with mutable class-level dict**
File: `app/services/game_service.py:16-24`
```python
class GameService:
    instance: Optional["GameService"] = None
    games: dict[str, GameEngine] = {}
```
`games` is a class variable shared across all instances. The `__new__` + `get_instance` dual pattern is redundant — one or the other suffices. Under Uvicorn with multiple workers, each worker gets its own process (so separate singletons), which is correct for in-memory state. But under async concurrency within a single worker, the dict access is not atomic.

**Recommendation:** For the current scale this is fine. For production: use Redis or a database for game state.

### 3.5 Error Handling

**Issue B-05 (HIGH): Silent exception suppression in all AI modules**
Files: `ai_base.py:78`, `easy_ai.py:41`, `medium_ai.py:46`, `hard_ai.py:57`
```python
except Exception:
    pass
```
Every AI class silently swallows exceptions. If `record_result` receives malformed data or `choose_move` encounters a state inconsistency, the failure is completely invisible. The AI falls back to random selection without any diagnostic.

**Recommendation:** At minimum, log the exception. In a game context where the fallback (random cell) is acceptable, a warning-level log is appropriate:
```python
except Exception as e:
    import logging
    logging.warning(f"AI fallback triggered: {e}")
    return random.choice(self.available_cells())
```

### 3.6 API Design

Endpoints are RESTful and well-structured. Status codes are correct (201 for creation, 400 for validation, 404 for not found). Response models are properly typed with Pydantic.

**Issue B-06 (LOW): No rate limiting**
No protection against rapid-fire API calls. A client could spam `/fire` and overwhelm the server. For a single-player game this is cosmetic, but worth noting.

**Issue B-07 (LOW): No game cleanup**
In-memory games accumulate indefinitely. No TTL, no cleanup endpoint, no max game limit. A long-running server will leak memory proportional to games created.

### 3.7 Data Models

Pydantic models are clean and typed. `StartGameRequest` with a default difficulty is good API design.

**Issue B-08 (LOW): `ShotResult.result` is a plain `str` instead of a Literal**
```python
class ShotResult(BaseModel):
    result: str  # Should be: Literal["hit", "miss", "sunk"]
```
Using `Literal` would provide runtime validation and better docs.

---

## 4 Frontend Audit

### 4.1 React Architecture

Single-page app with one main hook (`useGame`) managing all game state. This is appropriate for the complexity level — a state machine with three phases (setup, playing, gameOver).

**Issue F-01 (MEDIUM): `useGame` hook is 397 lines and handles everything**
The hook mixes game state, ship placement logic, API calls, sound effects, and turn management. At current size this is manageable but approaching the threshold where splitting into smaller hooks would improve maintainability:
- `useGameState` — API calls and state
- `useShipPlacement` — placement-specific logic
- `useTurnManager` — firing sequence and timing

### 4.2 Component Design

14 components with clear single responsibilities. Good use of TypeScript interfaces for props.

**Issue F-02 (LOW): Inline styles throughout GameHUD and ShipPlacement**
Heavy use of `style={{...}}` objects instead of Tailwind classes or CSS modules. Each render creates new style objects. Not a performance issue at this scale but inconsistent with the Tailwind setup.

### 4.3 State Management

State is managed entirely through React hooks — no external store. This is correct for a single-player game with no shared state between pages.

**Issue F-03 (MEDIUM): No abort controller for async fire sequence**
File: `hooks/useGame.ts:255-339`
The `fireShot` function chains multiple `setTimeout` delays with `setState` calls between them. If the component unmounts mid-sequence (e.g., user navigates away or restarts), state updates fire on an unmounted component. React 19 handles this gracefully (no warning), but the timeouts themselves continue running.

**Recommendation:** Use an `AbortController` or mounted ref:
```typescript
const mountedRef = useRef(true);
useEffect(() => () => { mountedRef.current = false; }, []);
// In fireShot: if (!mountedRef.current) return;
```

---

## 5 WebGL / 3D Rendering Audit

### 5.1 Scene Graph

Two `Board3D` groups at `[-7,0,0]` and `[7,0,0]`, each containing an Ocean mesh (128x128 segments), a Grid, 100 Cell slots, Ship groups, and transient effects. This is a reasonable scene graph.

**Performance concern:** Each board renders up to 100 Cell components. Most return `null` (empty cells that aren't clickable), but React still reconciles them every render. With effects, the component count peaks around ~230 R3F components.

### 5.2 Critical: setState in useFrame

**Issue F-04 (CRITICAL): Missile.tsx, Explosion.tsx, Splash.tsx all call `setState` inside `useFrame`**

Files:
- `Missile.tsx:32` — `setElapsed(newElapsed)`
- `Explosion.tsx:41` — `setElapsed(newElapsed)`
- `Splash.tsx:41` — `setElapsed(newElapsed)`

This is the single most impactful performance bug in the codebase. `useFrame` runs at 60fps. Calling `setState` inside it triggers a React re-render every frame — for the component AND its parent (Board3D). During a fire sequence with a missile, then an explosion (24 particles), then smoke, this means:

- 60 re-renders/sec from Missile
- 60 re-renders/sec from Explosion
- Each re-render reconciles the entire Board3D subtree (100+ cells)

**Fix:** Replace `useState` with `useRef` for elapsed time. Use a ref-based visibility flag for conditional rendering:

```typescript
// Before (BAD):
const [elapsed, setElapsed] = useState(0);
useFrame((_, delta) => {
  setElapsed(elapsed + delta); // Triggers re-render every frame
});
if (elapsed > DURATION) return null;

// After (GOOD):
const elapsedRef = useRef(0);
const [visible, setVisible] = useState(true);
useFrame((_, delta) => {
  elapsedRef.current += delta;
  if (elapsedRef.current > DURATION && visible) {
    setVisible(false); // Single re-render at end
    onComplete?.();
  }
  // ... update Three.js objects directly via refs
});
if (!visible) return null;
```

### 5.3 Render-time Side Effect in Board3D

**Issue F-05 (HIGH): `setEffects` called during render, not in useEffect**
File: `Board3D.tsx:60-71`
```typescript
if (resultKey && resultKey !== lastResultRef.current) {
  lastResultRef.current = resultKey;
  setEffects((prev) => [...prev, newEffect]); // setState during render
}
```
This triggers an additional re-render during the current render cycle. React handles this (it batches), but it's an anti-pattern that can cause subtle double-render bugs. Should be wrapped in `useEffect`:
```typescript
useEffect(() => {
  if (!latestResult) return;
  const key = `${latestResult.coordinate}-${latestResult.result}`;
  if (key === lastResultRef.current) return;
  lastResultRef.current = key;
  const pos = coordToPosition(latestResult.coordinate);
  setEffects((prev) => [...prev, { id: ..., type: 'missile', position: pos, resultType: latestResult.result }]);
}, [latestResult]);
```

### 5.4 Ocean Shader

The GLSL shader is well-written. 5 overlapping wave functions create convincing water motion. Fragment shader mixes deep/surface/foam colors with UV-based shimmer.

**Note:** The vertex shader displaces `pos.z` (which maps to the visual Y axis after the `-PI/2` X rotation). This is correct — the plane lies flat in XZ after rotation, and `pos.z` in local space becomes the vertical displacement.

**Issue F-06 (LOW): 128x128 segments per ocean = 16,384 vertices per board**
Two boards = 32,768 ocean vertices. This is acceptable for desktop but may cause stuttering on mobile/low-end devices. Consider reducing to 64x64 (4,096 vertices) with negligible visual difference.

### 5.5 Shader Uniform Memoization

**Issue F-07 (LOW): RadarSweep uniforms missing dependency**
File: `RadarSweep.tsx:66-72`
```typescript
const uniforms = useMemo(() => ({
  uTime: { value: 0 },
  uActive: { value: active ? 1.0 : 0.0 },
}), []);  // Missing 'active' in deps
```
The `active` value is captured at creation time and never updated via memoization. However, the `useFrame` at line 77 updates `uActive` every frame, so this is functionally correct — just misleading. The empty deps array is intentional to avoid recreating the material (which would break the ref). No actual bug, but should be commented.

### 5.6 Geometry Disposal

Three.js geometries created in `useMemo` (Grid.tsx, Ship.tsx hull) are not explicitly disposed when dependencies change. R3F handles cleanup of declarative `<boxGeometry>` etc., but manually created geometries via `new THREE.BufferGeometry()` should be disposed in a cleanup function.

**Issue F-08 (LOW):** Add disposal:
```typescript
useEffect(() => {
  return () => hullGeometry.dispose();
}, [hullGeometry]);
```

### 5.7 CameraController

Clean implementation using refs throughout (no useState). Lerp-based transitions are smooth. The intro sequence, fire tracking, and victory orbit all work correctly.

**Issue F-09 (LOW): `orbitEnabled` ref is set but never read**
File: `CameraController.tsx:50`
The `orbitEnabled` ref is modified on phase changes but never consumed. The `OrbitControls` component in GamePage doesn't reference it. This is dead code from an incomplete feature (disabling orbit during cinematics).

---

## 6 Animation System Audit

### 6.1 3D Animations (useFrame)

The project uses R3F's `useFrame` for all Three.js animations. This is the correct approach — it ties into Three.js's render loop and avoids fighting with React's reconciler.

**Good patterns observed:**
- CameraController: all refs, no state, lerp-based transitions
- Ocean: shader uniform updates via ref
- SmokeEffect: instanced mesh with Object3D dummy (correct pattern)

**Bad patterns observed:**
- Missile/Explosion/Splash: `useState` for elapsed time (see F-04)

### 6.2 2D Animations (Framer Motion)

Framer Motion is used correctly for HUD elements: enter/exit animations, `AnimatePresence` for conditional rendering, spring-based transitions.

**Issue F-10 (LOW): Radar SVG sweep creates new motion objects per frame**
File: `Radar.tsx:43-58`
The `motion.line` with `animate={{ rotate: 360 }}` and `repeat: Infinity` is a CSS animation (transform-based), not a JS-driven per-frame update. This is efficient and correct.

### 6.3 Sound Synchronization

Sounds are triggered inline within `useGame.ts` fire sequence alongside state updates. This creates tight coupling between game logic and audio, but for a single-module game it's acceptable.

**Issue F-11 (MEDIUM): No audio context error handling**
File: `useSound.ts:5-12`
```typescript
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext(); // Can throw on restrictive browsers
  }
```
Safari and some mobile browsers may block AudioContext creation without user gesture. The `useEffect` in `useSound` handles this by only initializing on click/keydown, but `playTone` and other functions call `getAudioContext()` directly without try/catch. If audio context creation fails, every subsequent sound call will throw.

---

## 7 AI Opponent Audit

### 7.1 Easy AI — Random Search

`easy_ai.py` (42 lines). Correct and intentionally weak. Picks a random unknown cell from the board state.

**Assessment:** Correct. The fallback chain (board_state -> available_cells) ensures it never crashes.

### 7.2 Medium AI — Hunt + Target

`medium_ai.py` (118 lines). Two-mode strategy with checkerboard optimization.

**Assessment:** Correct implementation. Checkerboard hunting halves the search space. Target queue is properly cleaned after sinking.

**Issue A-01 (LOW): Target queue is a list used as a FIFO (pop(0))**
File: `medium_ai.py:78`
```python
candidate = self.target_queue.pop(0)
```
`list.pop(0)` is O(n). Use `collections.deque` for O(1) popleft. At max queue size ~8 this doesn't matter, but it's technically wrong.

### 7.3 Hard AI — Probability Density + Orientation Targeting

`hard_ai.py` (164 lines) + `probability.py` (108 lines) + `orientation_target.py` (114 lines).

**Algorithm correctness:** Verified. The probability grid correctly enumerates all valid ship placements, filters by misses/sunk, and weights hits with a 5x multiplier. Orientation detection correctly identifies horizontal/vertical lines and extends endpoints.

**Issue A-02 (MEDIUM): `group_adjacent_hits` doesn't separate disjoint hit groups on the same row/col**
File: `hard_ai.py:131-157`
If two separate ships are hit on the same row with a gap between them, BFS grouping correctly separates them (since they're not adjacent). This is correct.

**Issue A-03 (LOW): Probability grid is rebuilt twice in target mode**
File: `hard_ai.py:119-126`
When multiple targets exist, the grid is built once per group iteration. If there are 2 unsunk ship groups, the grid is built twice. Since `build_probability_grid` iterates all remaining ships x all positions, this is O(ships * 100) per call — negligible for a 10x10 board but worth noting.

**Performance benchmark:** Hard AI on a 10x10 board with 5 ships takes < 1ms per move. No optimization needed.

### 7.4 Algorithm Improvements

The Hard AI could be improved with:
1. **Parity optimization:** After eliminating small ships, switch from checkerboard (parity 2) to parity 3/4/5 matching the smallest remaining ship.
2. **Hit adjacency weighting:** Currently weights all hits equally. Could weight based on how many unsunk hits are adjacent (favoring extending existing clusters).

These are enhancements, not bugs.

---

## 8 UI / UX Review

### 8.1 Visual Hierarchy

- Turn indicator (top center) is clear with green/red color coding
- Fleet status panels (left/right) provide at-a-glance information
- Difficulty badge (right side during play) is minimal and non-intrusive
- Board labels ("YOUR WATERS" / "ENEMY WATERS") at bottom 20% are well-positioned

### 8.2 Ship Placement UX

- Ship list with size indicators is clear
- Current ship is highlighted with blue border and pulse animation
- R to rotate is documented in-UI
- Auto-deploy and undo are available
- Difficulty selector in placement panel is good — lets player decide before committing

### 8.3 Gameplay Feedback

- Missile animation provides clear "shot fired" feedback
- Explosion vs splash visually distinguishes hit/miss
- Smoke on damaged cells provides persistent battlefield state
- Sound effects reinforce every action

**Issue U-01 (MEDIUM): No hover preview on enemy board**
During play, hovering over enemy cells changes cursor to crosshair but doesn't highlight the target cell distinctly. Adding a targeting reticle or cell highlight would improve aiming confidence.

**Issue U-02 (LOW): Game over screen difficulty selector doesn't restart immediately**
User must select difficulty then click "NEW BATTLE" as a separate action. Consider having difficulty buttons auto-restart at the new level.

### 8.4 Responsiveness

**Issue U-03 (MEDIUM): No responsive handling for small screens**
The dual-board layout with `boardSpacing = 7` is fixed. On screens narrower than ~1200px, both boards won't be visible simultaneously. The camera position doesn't adapt to viewport width.

---

## 9 Performance Audit

### 9.1 Bundle Size

```
dist/index-*.js   1,345 kB │ gzip: 386 kB
```

**Issue P-01 (MEDIUM): 1.3MB JS bundle (386KB gzipped)**
Breakdown (estimated):
- Three.js: ~700KB
- React + React DOM: ~150KB
- @react-three/fiber + drei: ~200KB
- Framer Motion: ~100KB
- Application code: ~100KB

Three.js is the dominant factor. Consider:
- Tree-shaking Three.js imports (import specific modules instead of `import * as THREE`)
- Dynamic import for the Canvas (lazy-load the 3D scene)
- `manualChunks` to split Three.js into a separate cached chunk

### 9.2 Render Performance

**Critical path:** During a fire sequence:
1. `setLastPlayerResult` triggers Board3D re-render
2. Board3D spawns Missile (starts `setElapsed` loop = 60 re-renders/sec)
3. Missile impact spawns Explosion (another 60 re-renders/sec)
4. Each re-render reconciles 100 Cell components + Ship groups

**Estimated impact:** During fire animation, React is reconciling ~200 components at 60fps. On modern hardware this is manageable (<5ms per reconciliation). On older devices it will cause frame drops.

**Fix priority:** Converting Missile/Explosion/Splash to ref-based animations (Issue F-04) would eliminate 99% of unnecessary re-renders during effects.

### 9.3 Memory

No explicit leaks detected. Three.js objects created declaratively in JSX are managed by R3F's lifecycle. The manually created hull geometry in Ship.tsx should have an explicit dispose (F-08) but is unlikely to leak since ships are rarely recreated.

Audio oscillators for ambient sound are properly stopped in useSound cleanup.

---

## 10 Security Audit

### 10.1 Input Validation

- Coordinate parsing validates format, column range (A-J), and row range (1-10). **Correct.**
- Ship placement validates alignment, bounds, overlap, and completeness. **Correct.**
- Difficulty is validated against allowed values. **Correct.**
- Game ID is validated via dict lookup. **Correct.**

### 10.2 Injection Risks

- No SQL (in-memory only): **N/A**
- No user-generated HTML rendering: **N/A**
- No file system access from user input: **N/A**
- API inputs are Pydantic-validated: **Good**

### 10.3 Denial of Service

**Issue S-01 (LOW): No rate limiting on any endpoint**
A client could spam `/game/start` creating unlimited game instances, eventually exhausting memory. Add a simple per-IP rate limit or max active games limit.

**Issue S-02 (LOW): No game TTL**
Games persist in memory indefinitely. Add a cleanup task that removes games older than 1 hour.

### 10.4 CORS

See Issue B-01. Not a security risk for a single-player local game, but a configuration smell.

### 10.5 Overall Security Posture

**Low risk.** The application has no authentication, no persistent storage, no user-to-user interaction, and no sensitive data. The attack surface is minimal. The primary risks are resource exhaustion (uncapped game creation) and CORS misconfiguration.

---

## 11 Testing Audit

### 11.1 Backend Tests

**50 tests, all passing in 0.08s.**

| Test Class | Count | Coverage |
|---|---|---|
| TestCoordinateParsing | 8 | Full — includes roundtrip, edge cases, invalid input |
| TestShip | 5 | Good — create, hit, sunk, invalid name, wrong size |
| TestBoard | 10 | Thorough — placement, overlap, bounds, diagonal, shots, random |
| TestGameEngine | 7 | Good — setup, fire, AI turn, win detection, state hiding |
| TestEasyAI | 2 | Basic — valid cell, no repeats |
| TestMediumAI | 3 | Good — valid cell, adjacent targeting, sunk cleanup |
| TestHardAI | 5 | Good — valid cell, no repeats, adjacent targeting, orientation, coverage |
| TestProbabilityGrid | 2 | Minimal — center>corners, miss reduction |
| TestOrientationDetection | 4 | Good — horizontal, vertical, single hit, target generation |

**Issue T-01 (MEDIUM): No integration tests**
No tests exercise the full API endpoint chain (start -> place -> fire -> win). All tests use engine classes directly. Add at least one test using `TestClient`:
```python
from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
```

**Issue T-02 (MEDIUM): No AI performance benchmark tests**
No test verifies that Hard AI actually performs better than Easy AI on average. A statistical test (100 games each, compare median turns to win) would catch regressions.

**Issue T-03 (LOW): No edge case test for AI with all ships sunk**
What happens if `choose_move` is called after all 100 cells are shot? `available_cells()` returns empty list, `random.choice([])` raises `IndexError`. The game engine prevents this (game ends before all cells are shot), but the AI itself has no guard.

### 11.2 Frontend Tests

**No frontend tests exist.** No unit tests, no component tests, no E2E tests.

**Recommendation:** At minimum, add tests for:
- `buildGridFromState` utility function (pure logic, easy to test)
- `useGame` hook state transitions (use `@testing-library/react-hooks`)
- Ship placement validation logic

---

## 12 Technical Debt

### 12.1 Fragile Modules

| Module | Fragility | Reason |
|---|---|---|
| `useGame.ts` | Medium | 397-line god hook mixing concerns |
| `Board3D.tsx` | Medium | Render-time side effect for spawning missiles |
| `Missile/Explosion/Splash` | High | useState in useFrame pattern breaks under load |

### 12.2 Duplicated Logic

| Duplication | Files | Lines |
|---|---|---|
| `coordToXZ` / `coordToPosition` / `coordToRowCol` | Ship.tsx, Board3D.tsx, useGame.ts | ~15 lines each |
| Difficulty color maps | GameHUD.tsx, ShipPlacement.tsx | Identical `DIFFICULTY_COLORS` object |
| Ship coordinate parsing `charCodeAt(0) - 65` | 4+ files | Same pattern |

**Recommendation:** Extract shared coordinate utilities into `src/utils/coordinates.ts` and shared constants into `src/constants.ts`.

### 12.3 Dead Code

| Item | File | Line |
|---|---|---|
| `orbitEnabled` ref | CameraController.tsx | 50 |
| `CinematicMode` type includes `'defeat'` but it's never set to that value | CameraController.tsx | 6 |

---

## 13 Recommended Architecture Improvements

### 13.1 Immediate (fix before next release)

1. **Fix setState in useFrame** in Missile.tsx, Explosion.tsx, Splash.tsx. Switch to ref-based animation with a single setState for visibility toggling.

2. **Move Board3D effect spawning into useEffect.** The render-time `setEffects` call in Board3D.tsx should be a `useEffect` watching `latestResult`.

3. **Add try/catch to `getAudioContext()`** and all sound functions to prevent unhandled throws on restrictive browsers.

### 13.2 Short-term (this sprint)

4. **Split useGame.ts** into `useGameState`, `useShipPlacement`, `useTurnSequence`.

5. **Add integration tests** for the full API flow.

6. **Add game cleanup** — TTL-based removal of stale games.

7. **Extract shared utilities** — coordinate parsing, difficulty colors.

### 13.3 Medium-term (next sprint)

8. **Code-split the 3D scene** — dynamic import the Canvas/Three.js chunk to improve initial load time.

9. **Add AI benchmark tests** — statistical comparison across difficulty levels.

10. **Responsive camera** — adapt camera position based on viewport aspect ratio.

### 13.4 Long-term (next quarter)

11. **Persistent game state** — Redis or SQLite for game state, enabling server restarts without data loss.

12. **Multiplayer** — WebSocket-based real-time play between two humans.

13. **Tauri packaging** — the plan mentions Tauri compatibility. The current codebase uses no browser-only APIs that would break Tauri, so packaging should work out of the box.

---

## 14 Suggested Roadmap

| Priority | Item | Effort | Impact |
|---|---|---|---|
| P0 | Fix useState in useFrame (F-04) | 1 hour | Critical perf fix |
| P0 | Move Board3D effect to useEffect (F-05) | 30 min | Eliminates render-time side effect |
| P1 | Add audio error handling (F-11) | 30 min | Prevents crashes on Safari/mobile |
| P1 | Add backend exception logging (B-05) | 30 min | Enables AI debugging |
| P1 | Add integration tests (T-01) | 2 hours | Validates API contract |
| P2 | Split useGame hook (F-01) | 2 hours | Maintainability |
| P2 | Extract shared utilities (12.2) | 1 hour | Reduces duplication |
| P2 | Code-split Three.js bundle (P-01) | 1 hour | Faster initial load |
| P2 | Game cleanup / TTL (B-07) | 1 hour | Memory management |
| P3 | Responsive camera (U-03) | 2 hours | Mobile/small screen support |
| P3 | AI benchmark tests (T-02) | 3 hours | Regression protection |
| P3 | Hover preview on enemy board (U-01) | 1 hour | UX improvement |
| P4 | Geometry disposal (F-08) | 30 min | VRAM cleanup |
| P4 | Remove dead code (12.3) | 15 min | Cleanup |
| P4 | Pydantic Literal types (B-08) | 15 min | Stricter validation |

---

**End of audit.**
