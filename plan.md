# ROLE

You are a principal game graphics engineer, senior technical artist, React Three Fiber architect, and cinematic UI designer.

You are rebuilding an existing Battleship frontend from the scene layer upward.

The current implementation is functional but visually unacceptable:
- fake striped water
- flat tactical boards
- weak scene composition
- ships that read like dark blocks
- no believable world scale
- no premium postprocessing glue
- not enough cinematic depth

We are **not** rewriting the backend or game rules.
We are rebuilding the **entire frontend scene, presentation, and visual language** so it feels like a proper 3D naval tactics game.

The backend already exists and works:
- FastAPI
- Python game engine
- difficulty levels already implemented
- stable API contract

The frontend already exists and works:
- React
- TypeScript
- React Three Fiber
- Three.js
- cleaned hooks
- fixed R3F performance issues

Now the mission is to build the scene **properly from scratch**.

Use the right technologies correctly:
- React Three Fiber as the Three.js renderer
- Three.js `Water` or a water implementation of similar quality as the primary benchmark for the ocean layer
- react-postprocessing for Bloom / Outline / Selection / SelectiveBloom style effects
- Drei helpers where useful
- GSAP and/or Theatre.js for cinematic choreography
- browser-first architecture that remains compatible with future Tauri wrapping

Important facts to respect:
- Three.js provides a `Water` object as a reflective animated flat water effect and it is a valid baseline for premium water presentation.
- react-postprocessing is the proper wrapper for postprocessing in R3F and can provide Bloom, DepthOfField, Outline, etc.
- React Three Fiber performance guidance explicitly warns against `setState` in `useFrame`, against excessive mounting, and encourages mutation/refs, shared geometries/materials, and instancing.
- Tauri compatibility should be preserved by keeping the frontend as a standard web app.

References for implementation choices:
- R3F intro: https://r3f.docs.pmnd.rs/getting-started/introduction
- Three.js Water: https://threejs.org/docs/pages/Water.html
- react-postprocessing intro: https://react-postprocessing.docs.pmnd.rs/introduction
- R3F performance pitfalls: https://r3f.docs.pmnd.rs/advanced/pitfalls

---

# PRIMARY GOAL

Create a **real 3D naval battlefield presentation**.

The new scene must feel like:
- ocean
- world scale
- atmosphere
- physical tactical surfaces
- readable ships
- cinematic camera composition
- premium glow and FX
- game-quality presentation

It must **not** feel like:
- UI on an animated sheet
- shader experiment
- debug dashboard
- transparent grids floating in space

---

# HARD VISUAL REQUIREMENTS

## 1. OCEAN
Replace the current fake water completely.

Implement a proper ocean solution:
- preferably based on Three.js `Water`
- or a custom shader at that quality level
- reflective or pseudo-reflective
- believable swell
- fresnel-ish edge response
- calm but premium motion
- horizon-friendly
- suitable for cinematic camera angles

Requirements:
- no striped scrolling texture look
- no cheap UV-only animation feel
- no “fabric” appearance
- support fog and scene lighting
- optional local disturbance / ripple near impacts if feasible

Deliver:
- `scene/environment/OceanSurface.tsx`
- `scene/materials/oceanConfig.ts`
- any normal-map or helper setup needed

Use a big water plane that extends past the boards so the world feels large.

---

## 2. WORLD COMPOSITION
Rebuild the entire scene composition.

The boards should no longer just sit centered on-screen.

Target composition:
- player board foreground-left
- enemy board midground-right
- visible ocean extending around and beyond both
- clear horizon line
- atmospheric depth
- asymmetry
- dramatic but readable angle

Add:
- sky dome / gradient sky / fog
- distant atmosphere
- horizon separation
- slight camera perspective that sells scale

Deliver:
- `scene/SceneRoot.tsx`
- `scene/environment/SkyBackdrop.tsx`
- `scene/environment/Atmosphere.tsx`
- `scene/environment/FogController.tsx`

---

## 3. PHYSICAL BOARDS
The tactical boards must become physical objects.

Each board should have:
- real frame geometry
- thickness
- bevel or edge treatment
- emissive trim
- tactical-glass / polished-surface feel
- correct light response
- clear faction identity

Player board:
- cool cyan identity

Enemy board:
- restrained red identity

Do not make them look like HTML panels.
Make them look like military tactical surfaces placed into the world.

Deliver:
- `scene/boards/PlayerBoard3D.tsx`
- `scene/boards/EnemyBoard3D.tsx`
- `scene/boards/GridPlane.tsx`
- `scene/boards/BoardFrame.tsx`
- `scene/boards/BoardMarkers.tsx`
- `scene/materials/boardGlowMaterial.ts`

---

## 4. SHIPS
The ships must become proper readable 3D pieces.

Current dark rectangular blocks are not acceptable.

Preferred path:
- use GLTF ship models if available

Fallback path:
- build elegant low-poly ship meshes procedurally

Requirements:
- distinct silhouettes by ship class / length
- readable hull + deck structure
- proper materials that catch light
- subtle bobbing
- optional wake
- visible damage state for hit
- stronger sunk-state treatment

Use the standard R3F / Drei asset loading approach if assets exist.
If not, generate attractive fallback geometry.

Deliver:
- `scene/fleet/ShipFactory.tsx`
- `scene/fleet/PlayerFleet.tsx`
- `scene/fleet/EnemyFleet.tsx`
- `scene/fleet/ShipWake.tsx`
- `scene/fleet/ShipDamageFX.tsx`

---

## 5. LIGHTING
Build a proper lighting rig.

Requirements:
- ambient fill
- cool directional key light
- subtle rim light for ships and frames
- emissive contribution from tactical elements
- stronger local contrast
- believable separation of water / boards / ships

Mood:
- cool
- deep
- premium
- naval
- cinematic

Avoid:
- washed out look
- muddy darkness
- flat lighting

Deliver:
- `scene/environment/LightingRig.tsx`

---

## 6. POSTPROCESSING
The scene must be glued together with proper postprocessing.

Add a post stack using `@react-three/postprocessing`.

Use:
- Bloom for emissive trims, reticles, tactical highlights
- Outline or Selection for hover / lock states
- Optional mild vignette
- Optional very subtle DOF only in cinematics, not regular gameplay
- Optional SMAA/MSAA if appropriate

The goal is premium cohesion, not overblown FX.

Deliver:
- `scene/post/PostStack.tsx`

Important:
- use emissive values and tone mapping settings appropriately so bloom actually works
- keep gameplay readability first

---

## 7. CAMERA
The camera must be completely rethought.

The current framing is not acceptable.

Implement a real camera system with:
- authored composition
- better angles
- stronger depth
- readable boards
- dynamic event framing
- responsive framing for different viewport sizes

Required shots:
1. intro fly-in over ocean
2. settle into deployment angle
3. battle framing
4. player target focus
5. missile follow shot
6. impact punch-in
7. enemy turn emphasis
8. victory orbit
9. defeat pullback

Use Theatre.js and/or GSAP for cinematic choreography where appropriate.

Deliver:
- `scene/cameras/MainCameraRig.tsx`
- `scene/cameras/CinematicCameraController.tsx`
- `scene/cameras/CameraShots.ts`
- `scene/cameras/responsiveFraming.ts`
- `scene/theatre/theatreProject.ts`
- `scene/theatre/theatreSheets.ts`
- `scene/theatre/sequences.ts`
- `scene/animation/gsapTimelines.ts`

---

## 8. RADAR / TARGETING / TACTICAL FEEL
The enemy board must feel like a target acquisition surface.

Requirements:
- radar sweep that feels premium
- hover confidence
- target lock reticle
- board-local pulse
- clearer active target indication
- no clutter

Deliver:
- `scene/effects/RadarSweep.tsx`
- `scene/boards/TargetLock.tsx`
- `scene/materials/radarMaterial.ts`
- `scene/materials/reticleMaterial.ts`

---

## 9. MISSILES / IMPACTS
Keep the current stable architecture, but do a visual art pass.

Requirements:
- missile trail looks intentional
- launch has presence
- miss = water splash + ripple + cool light
- hit = hot flash + smoke + impact intensity
- sunk = stronger flourish
- camera can react to impact
- do not reintroduce bad R3F patterns

Deliver:
- `scene/effects/MissileSystem.tsx`
- `scene/effects/MissileTrail.tsx`
- `scene/effects/ExplosionSystem.tsx`
- `scene/effects/SplashSystem.tsx`
- `scene/effects/ShockwaveRing.tsx`
- `scene/effects/HitFlash.tsx`

---

## 10. HUD
The HUD should be redesigned to fit the new world.

Current HUD should become:
- cleaner
- more premium
- more game-like
- more integrated
- less “app panel”

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

Keep it premium and restrained.

---

## 11. PERFORMANCE RULES
Do not break the cleaned codebase.

Must follow:
- no `setState` in `useFrame`
- reuse materials/geometries where possible
- use refs and mutation in frame loops
- avoid excessive mount/unmount churn
- use instancing where appropriate
- keep ocean and post stack performant
- support quality modes if helpful

Deliver:
- `utils/quality.ts`
- `utils/sceneTheme.ts`
- `utils/viewport.ts`

---

## 12. TAURI READINESS
Keep the frontend browser-first but easy to wrap with Tauri later.

Provide:
- sample `src-tauri/tauri.conf.json`
- notes for future desktop packaging

Do not introduce hacks that would fight Tauri later.

---

# REQUIRED FILE STRUCTURE

Refactor or expand toward:

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
        oceanConfig.ts
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

When responding, do it in this exact order:

## 1. Scene redesign overview
Explain the visual direction and technical architecture

## 2. Updated folder tree

## 3. Install commands
Include all needed packages:
- three
- @react-three/fiber
- @react-three/drei
- @react-three/postprocessing
- gsap
- @theatre/core
- @theatre/r3f
- @theatre/studio
- any utility packages you choose

## 4. Core utilities
Show full code for:
- `utils/sceneTheme.ts`
- `utils/quality.ts`
- `utils/viewport.ts`

## 5. Water / materials
Show full code for:
- `scene/environment/OceanSurface.tsx`
- `scene/materials/oceanConfig.ts`
- `scene/materials/radarMaterial.ts`
- `scene/materials/boardGlowMaterial.ts`
- `scene/materials/reticleMaterial.ts`

## 6. Environment
Show full code for:
- `SkyBackdrop.tsx`
- `Atmosphere.tsx`
- `FogController.tsx`
- `LightingRig.tsx`

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

## 9. Camera / animation
Show full code for:
- `MainCameraRig.tsx`
- `CinematicCameraController.tsx`
- `CameraShots.ts`
- `responsiveFraming.ts`
- `theatreProject.ts`
- `theatreSheets.ts`
- `sequences.ts`
- `gsapTimelines.ts`

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
Explain exactly how to wire the new scene into the current cleaned codebase

## 14. Tauri config
Show a sample `src-tauri/tauri.conf.json`

## 15. Final validation checklist
Confirm:
- water no longer looks fake
- boards feel physical
- ships are more readable
- scene has world depth
- postprocessing is added
- camera composition is improved
- gameplay is preserved
- future Tauri wrapping remains easy

If the output is too long, continue in clearly labeled parts.
Do not reduce scope.
Do not give a shallow answer.

Start now.