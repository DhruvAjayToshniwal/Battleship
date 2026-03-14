import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_SHOTS } from "./CameraShots";
import { getResponsiveShot } from "./responsiveFraming";
import { easeOutCubic } from "../animation/gsapTimelines";
import { shakeCamera } from "../animation/impactSequences";

type CameraMode =
  | "intro"
  | "idle"
  | "playerFire"
  | "enemyFire"
  | "victoryOrbit"
  | "defeatPullback";

interface CinematicCameraControllerProps {
  phase: "setup" | "playing" | "gameOver";
  isPlayerTurn: boolean;
  isFiring: boolean;
  lastFireCoord: string | null;
  boardSpacing: number;
}

const fireTargetVec = new THREE.Vector3();

function coordToWorldPosition(
  coord: string,
  boardSpacing: number,
  out: THREE.Vector3
): THREE.Vector3 {
  const col = coord.charCodeAt(0) - 65;
  const row = parseInt(coord.slice(1), 10) - 1;
  return out.set(boardSpacing + (col - 4.5) * 1.1, 0, (row - 4.5) * 1.1);
}

export default function CinematicCameraController({
  phase,
  isPlayerTurn,
  isFiring,
  lastFireCoord,
  boardSpacing,
}: CinematicCameraControllerProps) {
  const { camera, size } = useThree();
  const modeRef = useRef<CameraMode>("intro");
  const introTimeRef = useRef(0);
  const introDoneRef = useRef(false);
  const fireTimeRef = useRef(0);
  const fireActiveRef = useRef(false);
  const prevFiringRef = useRef(false);
  const prevPhaseRef = useRef(phase);
  const orbitAngleRef = useRef(0);
  const lerpSpeedRef = useRef(3);
  const targetPosRef = useRef(new THREE.Vector3());
  const targetLookRef = useRef(new THREE.Vector3());
  const targetFovRef = useRef(50);
  const defeatTimeRef = useRef(0);

  const scratchVecs = useMemo(() => ({
    currentLook: new THREE.Vector3(),
    desiredLook: new THREE.Vector3(),
    lookTarget: new THREE.Vector3(),
  }), []);

  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.05);
    const perspCamera = camera as THREE.PerspectiveCamera;

    if (phase !== prevPhaseRef.current) {
      if (phase === "gameOver") {
        if (isPlayerTurn) {
          modeRef.current = "victoryOrbit";
          orbitAngleRef.current = 0;
        } else {
          modeRef.current = "defeatPullback";
          defeatTimeRef.current = 0;
        }
      } else if (phase === "playing" && prevPhaseRef.current === "setup") {
        modeRef.current = "idle";
      }
      prevPhaseRef.current = phase;
    }

    if (isFiring && !prevFiringRef.current) {
      fireTimeRef.current = 0;
      fireActiveRef.current = true;
      if (isPlayerTurn) {
        modeRef.current = "playerFire";
      } else {
        modeRef.current = "enemyFire";
      }
    }
    prevFiringRef.current = isFiring;

    const mode = modeRef.current;

    if (mode === "intro") {
      introTimeRef.current += clampedDelta;
      const progress = Math.min(introTimeRef.current / 3, 1);
      const eased = easeOutCubic(progress);

      const startShot = getResponsiveShot(CAMERA_SHOTS.introStart, size.width, size.height);
      const endShot = getResponsiveShot(CAMERA_SHOTS.setup, size.width, size.height);

      targetPosRef.current.set(
        THREE.MathUtils.lerp(startShot.position[0], endShot.position[0], eased),
        THREE.MathUtils.lerp(startShot.position[1], endShot.position[1], eased),
        THREE.MathUtils.lerp(startShot.position[2], endShot.position[2], eased)
      );
      targetLookRef.current.set(
        THREE.MathUtils.lerp(startShot.target[0], endShot.target[0], eased),
        THREE.MathUtils.lerp(startShot.target[1], endShot.target[1], eased),
        THREE.MathUtils.lerp(startShot.target[2], endShot.target[2], eased)
      );
      targetFovRef.current = THREE.MathUtils.lerp(startShot.fov, endShot.fov, eased);

      if (progress >= 1 && !introDoneRef.current) {
        introDoneRef.current = true;
        modeRef.current = "idle";
      }
    } else if (mode === "idle") {
      const shot = phase === "setup"
        ? getResponsiveShot(CAMERA_SHOTS.setup, size.width, size.height)
        : getResponsiveShot(CAMERA_SHOTS.battleOverview, size.width, size.height);
      targetPosRef.current.set(...shot.position);
      targetLookRef.current.set(...shot.target);
      targetFovRef.current = shot.fov;
      lerpSpeedRef.current = 3;
    } else if (mode === "playerFire") {
      fireTimeRef.current += clampedDelta;
      if (fireTimeRef.current < 2.5) {
        if (lastFireCoord) {
          coordToWorldPosition(lastFireCoord, boardSpacing, fireTargetVec);
        } else {
          const shot = CAMERA_SHOTS.enemyFocus;
          fireTargetVec.set(...shot.target);
        }

        const missileShot = getResponsiveShot(CAMERA_SHOTS.missileFollow, size.width, size.height);
        targetPosRef.current.set(
          fireTargetVec.x + missileShot.position[0],
          missileShot.position[1],
          fireTargetVec.z + missileShot.position[2]
        );
        targetLookRef.current.copy(fireTargetVec);
        targetFovRef.current = missileShot.fov;
        lerpSpeedRef.current = 5;

        if (fireTimeRef.current > 0.8 && fireTimeRef.current < 0.85) {
          try {
            shakeCamera(camera as THREE.PerspectiveCamera, 0.2, 0.3);
          } catch {
            // noop
          }
        }
      } else {
        modeRef.current = "idle";
        fireActiveRef.current = false;
      }
    } else if (mode === "enemyFire") {
      fireTimeRef.current += clampedDelta;
      if (fireTimeRef.current < 2) {
        const shot = getResponsiveShot(CAMERA_SHOTS.playerFocus, size.width, size.height);
        targetPosRef.current.set(...shot.position);
        targetLookRef.current.set(...shot.target);
        targetFovRef.current = shot.fov;
        lerpSpeedRef.current = 4;
      } else {
        modeRef.current = "idle";
        fireActiveRef.current = false;
      }
    } else if (mode === "victoryOrbit") {
      orbitAngleRef.current += clampedDelta * 0.3;
      const radius = 22;
      const height = 12 + Math.sin(orbitAngleRef.current * 0.5) * 3;
      targetPosRef.current.set(
        Math.sin(orbitAngleRef.current) * radius,
        height,
        Math.cos(orbitAngleRef.current) * radius
      );
      targetLookRef.current.set(0, 0, 0);
      targetFovRef.current = CAMERA_SHOTS.victoryOrbit.fov;
      lerpSpeedRef.current = 2;
    } else if (mode === "defeatPullback") {
      defeatTimeRef.current += clampedDelta;
      const progress = Math.min(defeatTimeRef.current / CAMERA_SHOTS.defeatPullback.duration, 1);
      const eased = easeOutCubic(progress);

      const startShot = getResponsiveShot(CAMERA_SHOTS.battleOverview, size.width, size.height);
      const endShot = getResponsiveShot(CAMERA_SHOTS.defeatPullback, size.width, size.height);

      targetPosRef.current.set(
        THREE.MathUtils.lerp(startShot.position[0], endShot.position[0], eased),
        THREE.MathUtils.lerp(startShot.position[1], endShot.position[1], eased),
        THREE.MathUtils.lerp(startShot.position[2], endShot.position[2], eased)
      );
      targetLookRef.current.set(...endShot.target);
      targetFovRef.current = THREE.MathUtils.lerp(startShot.fov, endShot.fov, eased);
      lerpSpeedRef.current = 1.5;
    }

    const lerpFactor = 1 - Math.exp(-lerpSpeedRef.current * clampedDelta);
    camera.position.lerp(targetPosRef.current, lerpFactor);

    camera.getWorldDirection(scratchVecs.currentLook);
    scratchVecs.desiredLook.copy(targetLookRef.current).sub(camera.position).normalize();
    scratchVecs.currentLook.lerp(scratchVecs.desiredLook, lerpFactor);
    scratchVecs.lookTarget.copy(camera.position).add(scratchVecs.currentLook);
    camera.lookAt(scratchVecs.lookTarget);

    const newFov = THREE.MathUtils.lerp(perspCamera.fov, targetFovRef.current, lerpFactor);
    if (Math.abs(newFov - perspCamera.fov) > 0.01) {
      perspCamera.fov = newFov;
      perspCamera.updateProjectionMatrix();
    }
  });

  return null;
}
