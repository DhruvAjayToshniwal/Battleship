# ROLE

You are a principal game UI engineer, graphics engineer, R3F/Three.js architect, and cinematic art-direction specialist.

You are working inside an existing Battleship codebase that is already functional and has recently been refactored for performance and maintainability.

The project already has:
- FastAPI backend
- Python game engine
- AI difficulty levels
- React frontend
- React Three Fiber / Three.js scene
- cleaned hooks
- no `setState` in `useFrame`
- fixed Board3D effect spawning
- targeting reticle / hover improvements
- improved error handling

Your job now is to stop treating the scene like “UI panels on an animated plane” and **rebuild it as a proper cinematic 3D naval battlefield**.

Use the right tools and use them properly:
- React Three Fiber as the declarative Three.js renderer :contentReference[oaicite:0]{index=0}
- Three.js Water or an equivalent high-quality reflective water solution as the visual benchmark for the ocean layer :contentReference[oaicite:1]{index=1}
- react-postprocessing Bloom / Outline / SelectiveBloom to tie emissive tactical elements together visually :contentReference[oaicite:2]{index=2}
- Theatre.js and/or GSAP for authored cinematic movement and event choreography
- Tauri-compatible project structure for future desktop wrapping :contentReference[oaicite:3]{index=3}

Do not deliver generic polish.
Do a **full scene redesign**.

---

# PRIMARY GOAL

Transform the current game from:

- two flat tactical boards
- sitting on fake scrolling water
- with weak lighting and no atmosphere

into:

- a believable ocean world
- with physical tactical boards embedded into that world
- with cinematic camera composition
- proper visual depth
- better ship presence
- premium postprocessing
- stronger tactical readability
- cleaner premium HUD composition

The result must feel like:
- a polished indie naval tactics game
- cinematic and atmospheric
- readable and demo-worthy
- high quality enough for interview presentation
- still compatible with future Tauri packaging

---

# HARD TRUTH TO FIX

The current scene feels like:
- “dashboard on fabric”
- “shader experiment”
- “2D boards on a sheet”

It must instead feel like:
- “naval battlefield”
- “physical command simulation”
- “dramatic ocean combat scene”

That means the redesign must address:

1. Water realism
2. World composition
3. Physical board presentation
4. Ship readability
5. Lighting and atmosphere
6. Postprocessing
7. Camera composition
8. HUD integration

---

# WHAT MUST CHANGE

## 1. OCEAN
The current water look is not acceptable.
It looks like a scrolling striped material, not an ocean.

Replace it with a proper ocean solution using either:
- Three.js `Water`
- or a custom shader inspired by that level of quality
- or a hybrid shader setup that produces believable reflective animated water

The target quality bar is the Three.js Water-style look:
- reflective
- animated
- depth-aware
- smooth and premium :contentReference[oaicite:4]{index=4}

Requirements:
- directional swell
- reflective or pseudo-reflective highlights
- fresnel-like edge tint
- deeper color in distance
- calmer believable motion
- no cheap vertical stripe effect
- optional subtle impact ripples if feasible

Create:
- `scene/environment/OceanSurface.tsx`
- `scene/materials/oceanMaterial.ts`

If you choose Three.js Water, integrate it cleanly.
If you choose custom shader, make it premium and efficient.

---

## 2. WORLD COMPOSITION
The scene must stop being “two centered panels.”

Recompose the world so it has:
- horizon line
- atmospheric depth
- foreground / midground / background
- asymmetrical framing
- strong sense of scale

Desired composition:
- player board in foreground-left
- enemy board in midground-right
- visible ocean extending beyond both
- camera angle with depth, not flat top-down
- distant fog / horizon separation

Create:
- `scene/SceneRoot.tsx`
- `scene/environment/SkyBackdrop.tsx`
- `scene/environment/Atmosphere.tsx`
- `scene/environment/FogController.tsx`

---

## 3. PHYSICAL BOARDS
The boards must stop feeling like transparent UI rectangles.

Make them feel like real objects:
- framed
- thick
- slightly elevated or embedded
- emissive trim
- corner lights / anchor bolts / tactical nodes
- reflective / glassy tactical top surface if appropriate
- proper lighting response
- shadow / depth presence

Create:
- `scene/boards/PlayerBoard3D.tsx`
- `scene/boards/EnemyBoard3D.tsx`
- `scene/boards/GridPlane.tsx`
- `scene/boards/BoardFrame.tsx`
- `scene/boards/BoardMarkers.tsx`

Requirements:
- player board = cool cyan identity
- enemy board = restrained red identity
- hover states elegant
- previously fired cells readable
- active board emphasis
- targetable cells visually confident
- not noisy

---

## 4. SHIPS
The ships currently read like dark anonymous blocks.

Fix this by creating a real ship presentation system.

Preferred path:
- load GLTF assets if available

Fallback path:
- generate clean low-poly ship silhouettes procedurally

Requirements:
- distinct silhouettes by ship type/size
- readable deck / hull structure
- proper materials catching light
- subtle bobbing
- optional wake / disturbance
- visible damaged state
- sunk state treatment

Use the normal R3F / Drei loading path for GLTF if assets are provided. If not, build elegant fallback geometry. :contentReference[oaicite:5]{index=5}

Create:
- `scene/fleet/ShipFactory.tsx`
- `scene/fleet/PlayerFleet.tsx`
- `scene/fleet/EnemyFleet.tsx`
- `scene/fleet/ShipWake.tsx`
- `scene/fleet/ShipDamageFX.tsx`

---

## 5. LIGHTING
The current scene lacks cinematic lighting hierarchy.

Build a proper lighting rig:
- ambient fill
- cold directional key light
- subtle rim light
- emissive tactical contribution
- optional contact shadows / fake shadowing where helpful
- stronger separation between boards and water

Create:
- `scene/environment/LightingRig.tsx`

Mood:
- cool
- naval
- premium
- not overexposed
- not muddy

---

## 6. POSTPROCESSING
This scene needs postprocessing glue.

Add:
- Bloom for emissive trims, reticles, select highlights
- Outline or Selection for hover / focus / target lock states
- Optional mild vignette or tone pass
- Optional subtle depth of field only during cinematics, not during active gameplay

Use react-postprocessing appropriately. Bloom is selective when emissive values are pushed beyond the normal 0–1 range and `toneMapped={false}` is used on glow-driving materials. :contentReference[oaicite:6]{index=6}

Create:
- `scene/post/PostStack.tsx`

Use:
- selective bloom for board trim, reticles, radar sweep, important UI-linked emissives
- outline for selected/hovered targets if tasteful

Do not overdo it.

---

## 7. CAMERA
The camera is compositionally dead right now.

Build a real cinematic camera system.

Requirements:
- authored composition
- asymmetrical framing
- stronger depth cues
- battle readability
- dramatic but controlled movement

Implement:
- intro fly-in
- deployment settle
- player targeting angle
- missile follow shot
- impact punch-in
- enemy turn emphasis
- victory orbit
- defeat pullback

Create:
- `scene/cameras/MainCameraRig.tsx`
- `scene/cameras/CinematicCameraController.tsx`
- `scene/cameras/CameraShots.ts`
- `scene/cameras/responsiveFraming.ts`

Use Theatre.js and/or GSAP where appropriate.
The camera should feel directed, not arbitrary.

Also support responsive framing:
- wide desktop
- narrow desktop
- future Tauri window sizes

---

## 8. RADAR / TACTICAL FX
The radar should feel premium, not generic.

Upgrade:
- sweep beam
- lock ring
- hover confirmation
- target acquisition pulse
- subtle sonar energy

Create:
- `scene/effects/RadarSweep.tsx`
- `scene/materials/radarMaterial.ts`
- `scene/materials/reticleMaterial.ts`
- `scene/boards/TargetLock.tsx`

Keep enemy targeting clear and satisfying.

---

## 9. MISSILES / IMPACTS
The effects are stable now, but need a visual art pass.

Upgrade:
- missile trail
- launch flash
- impact light
- miss = blue-white splash + ripple
- hit = hot flash + smoke + shock feeling
- sunk = distinct flourish

Create:
- `scene/effects/MissileSystem.tsx`
- `scene/effects/MissileTrail.tsx`
- `scene/effects/ExplosionSystem.tsx`
- `scene/effects/SplashSystem.tsx`
- `scene/effects/ShockwaveRing.tsx`
- `scene/effects/HitFlash.tsx`

Do not reintroduce bad R3F performance patterns.

---

## 10. HUD REDESIGN
The HUD must stop feeling like a generic overlay panel.

Redesign it into a premium command-center HUD.

Goals:
- cleaner hierarchy
- premium spacing/typography
- fewer “debug app” vibes
- stronger turn messaging
- better phase communication
- integrated with the scene’s art direction

Create:
- `components/hud/CommandHUD.tsx`
- `components/hud/TopStatusBar.tsx`
- `components/hud/FleetPanel.tsx`
- `components/hud/TurnBanner.tsx`
- `components/hud/FireControlPanel.tsx`
- `components/hud/DifficultyBadge.tsx`
- `components/hud/NotificationStack.tsx`

Create overlays:
- `components/overlays/IntroOverlay.tsx`
- `components/overlays/VictoryOverlay.tsx`
- `components/overlays/DefeatOverlay.tsx`
- `components/overlays/LoadingOverlay.tsx`
- `components/overlays/NetworkErrorOverlay.tsx`

Requirements:
- still readable
- premium
- restrained
- no overdesigned nonsense
- should feel like a game, not a form

---

## 11. PERFORMANCE
Do not ruin the cleanup pass.

Rules:
- no `setState` in `useFrame`
- avoid recreating materials/geometries
- use refs / memoization properly
- use postprocessing carefully
- keep ocean solution performant
- support quality presets

Create:
- `utils/quality.ts`
- optional low/high/cinematic quality modes

---

## 12. TAURI READINESS
Keep the project browser-first but future desktop-wrap ready.

Provide:
- `src-tauri/tauri.conf.json`
- notes for using the current frontend with Tauri later

Tauri uses configuration files such as `tauri.conf.json`; keep the structure standard and non-invasive. :contentReference[oaicite:7]{index=7}

---

# REQUIRED FOLDER STRUCTURE

Refactor or expand toward this:

frontend/
  src/
    scene/
      SceneRoot.tsx

      environment/
        OceanSurface.tsx
        SkyBackdrop.tsx
        Atmosphere.tsx
        FogController.tsx
        LightingRig.tsx

      boards/
        PlayerBoard3D.tsx
        EnemyBoard3D.tsx
        GridPlane.tsx
        BoardFrame.tsx
        BoardMarkers.tsx
        TargetLock.tsx

      fleet/
        ShipFactory.tsx
        PlayerFleet.tsx
        EnemyFleet.tsx
        ShipWake.tsx
        ShipDamageFX.tsx

      cameras/
        MainCameraRig.tsx
        CinematicCameraController.tsx
        CameraShots.ts
        responsiveFraming.ts

      effects/
        MissileSystem.tsx
        MissileTrail.tsx
        ExplosionSystem.tsx
        SplashSystem.tsx
        ShockwaveRing.tsx
        HitFlash.tsx
        RadarSweep.tsx

      materials/
        oceanMaterial.ts
        radarMaterial.ts
        boardGlowMaterial.ts
        reticleMaterial.ts

      post/
        PostStack.tsx

      theatre/
        theatreProject.ts
        theatreSheets.ts
        sequences.ts

      animation/
        gsapTimelines.ts
        impactSequences.ts
        turnTransitions.ts

    components/
      hud/
        CommandHUD.tsx
        TopStatusBar.tsx
        FleetPanel.tsx
        TurnBanner.tsx
        FireControlPanel.tsx
        DifficultyBadge.tsx
        NotificationStack.tsx

      overlays/
        IntroOverlay.tsx
        VictoryOverlay.tsx
        DefeatOverlay.tsx
        LoadingOverlay.tsx
        NetworkErrorOverlay.tsx

    utils/
      quality.ts
      sceneTheme.ts
      viewport.ts

src-tauri/
  tauri.conf.json

---

# OUTPUT INSTRUCTIONS

When responding, do it in this order:

## 1. Scene redesign overview
Explain the new visual direction and architecture

## 2. Updated folder tree

## 3. Install commands
List all needed deps for:
- R3F / Three
- postprocessing
- Theatre.js
- GSAP
- any helper libs you choose

## 4. Core theme / quality utilities
Show full code for:
- `utils/sceneTheme.ts`
- `utils/quality.ts`
- `utils/viewport.ts`

## 5. Materials / shaders
Show full code for:
- `materials/oceanMaterial.ts`
- `materials/radarMaterial.ts`
- `materials/boardGlowMaterial.ts`
- `materials/reticleMaterial.ts`

## 6. Environment
Show full code for:
- `OceanSurface.tsx`
- `SkyBackdrop.tsx`
- `Atmosphere.tsx`
- `LightingRig.tsx`
- `FogController.tsx`

## 7. Boards
Show full code for:
- `PlayerBoard3D.tsx`
- `EnemyBoard3D.tsx`
- `GridPlane.tsx`
- `BoardFrame.tsx`
- `BoardMarkers.tsx`
- `TargetLock.tsx`

## 8. Fleet
Show full code for:
- `ShipFactory.tsx`
- `PlayerFleet.tsx`
- `EnemyFleet.tsx`
- `ShipWake.tsx`
- `ShipDamageFX.tsx`

## 9. Camera system
Show full code for:
- `MainCameraRig.tsx`
- `CinematicCameraController.tsx`
- `CameraShots.ts`
- `responsiveFraming.ts`
- `theatreProject.ts`
- `theatreSheets.ts`
- `sequences.ts`
- `gsapTimelines.ts`
- `impactSequences.ts`
- `turnTransitions.ts`

## 10. Effects
Show full code for:
- `MissileSystem.tsx`
- `MissileTrail.tsx`
- `ExplosionSystem.tsx`
- `SplashSystem.tsx`
- `ShockwaveRing.tsx`
- `HitFlash.tsx`
- upgraded `RadarSweep.tsx`

## 11. Postprocessing
Show full code for:
- `post/PostStack.tsx`

## 12. HUD / overlays
Show full code for:
- `CommandHUD.tsx`
- `TopStatusBar.tsx`
- `FleetPanel.tsx`
- `TurnBanner.tsx`
- `FireControlPanel.tsx`
- `DifficultyBadge.tsx`
- `NotificationStack.tsx`
- `IntroOverlay.tsx`
- `VictoryOverlay.tsx`
- `DefeatOverlay.tsx`
- `LoadingOverlay.tsx`
- `NetworkErrorOverlay.tsx`

## 13. Integration notes
Explain exactly how to wire this into the cleaned codebase

## 14. Tauri config
Show a sample `src-tauri/tauri.conf.json`

## 15. Final validation checklist
Confirm:
- scene no longer looks like UI on fabric
- ocean upgraded
- boards feel physical
- ships more readable
- camera composition improved
- postprocessing added
- gameplay preserved
- future Tauri wrapping preserved

If output gets too long, continue in clearly labeled parts and do not reduce ambition.

Start now.