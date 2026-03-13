import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_SHOTS } from "./CameraShots";
import { getResponsiveShot } from "./responsiveFraming";

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

function coordToWorldPosition(
  coord: string,
  boardSpacing: number
): THREE.Vector3 {
  const col = coord.charCodeAt(0) - 65;
  const row = parseInt(coord.slice(1), 10) - 1;
  const x = boardSpacing + (col - 4.5) * 1.1;
  const z = (row - 4.5) * 1.1;
  return new THREE.Vector3(x, 0, z);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
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

  useFrame((_, delta) => {
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

    if (modeRef.current === "intro") {
      introTimeRef.current += delta;
      const progress = Math.min(introTimeRef.current / 3, 1);
      const eased = easeOutCubic(progress);

      const startShot = getResponsiveShot(
        CAMERA_SHOTS.introStart,
        size.width,
        size.height
      );
      const endShot = getResponsiveShot(
        CAMERA_SHOTS.setup,
        size.width,
        size.height
      );

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
      targetFovRef.current = THREE.MathUtils.lerp(
        startShot.fov,
        endShot.fov,
        eased
      );

      if (progress >= 1 && !introDoneRef.current) {
        introDoneRef.current = true;
        modeRef.current = phase === "playing" ? "idle" : "intro";
        if (phase === "setup") {
          modeRef.current = "idle";
        }
      }
    }

    if (modeRef.current === "idle") {
      const shot =
        phase === "setup"
          ? getResponsiveShot(CAMERA_SHOTS.setup, size.width, size.height)
          : getResponsiveShot(
              CAMERA_SHOTS.battleOverview,
              size.width,
              size.height
            );
      targetPosRef.current.set(...shot.position);
      targetLookRef.current.set(...shot.target);
      targetFovRef.current = shot.fov;
      lerpSpeedRef.current = 3;
    }

    if (modeRef.current === "playerFire") {
      fireTimeRef.current += delta;
      if (fireTimeRef.current < 2.5) {
        let fireTarget: THREE.Vector3;
        if (lastFireCoord) {
          fireTarget = coordToWorldPosition(lastFireCoord, boardSpacing);
        } else {
          const shot = CAMERA_SHOTS.enemyFocus;
          fireTarget = new THREE.Vector3(...shot.target);
        }

        const missileShot = getResponsiveShot(
          CAMERA_SHOTS.missileFollow,
          size.width,
          size.height
        );
        targetPosRef.current.set(
          fireTarget.x + missileShot.position[0],
          missileShot.position[1],
          fireTarget.z + missileShot.position[2]
        );
        targetLookRef.current.copy(fireTarget);
        targetFovRef.current = missileShot.fov;
        lerpSpeedRef.current = 5;
      } else {
        modeRef.current = "idle";
        fireActiveRef.current = false;
      }
    }

    if (modeRef.current === "enemyFire") {
      fireTimeRef.current += delta;
      if (fireTimeRef.current < 2) {
        const shot = getResponsiveShot(
          CAMERA_SHOTS.playerFocus,
          size.width,
          size.height
        );
        targetPosRef.current.set(...shot.position);
        targetLookRef.current.set(...shot.target);
        targetFovRef.current = shot.fov;
        lerpSpeedRef.current = 4;
      } else {
        modeRef.current = "idle";
        fireActiveRef.current = false;
      }
    }

    if (modeRef.current === "victoryOrbit") {
      orbitAngleRef.current += delta * 0.3;
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
    }

    if (modeRef.current === "defeatPullback") {
      defeatTimeRef.current += delta;
      const progress = Math.min(
        defeatTimeRef.current / CAMERA_SHOTS.defeatPullback.duration,
        1
      );
      const eased = easeOutCubic(progress);

      const startShot = getResponsiveShot(
        CAMERA_SHOTS.battleOverview,
        size.width,
        size.height
      );
      const endShot = getResponsiveShot(
        CAMERA_SHOTS.defeatPullback,
        size.width,
        size.height
      );

      targetPosRef.current.set(
        THREE.MathUtils.lerp(startShot.position[0], endShot.position[0], eased),
        THREE.MathUtils.lerp(startShot.position[1], endShot.position[1], eased),
        THREE.MathUtils.lerp(startShot.position[2], endShot.position[2], eased)
      );
      targetLookRef.current.set(...endShot.target);
      targetFovRef.current = THREE.MathUtils.lerp(
        startShot.fov,
        endShot.fov,
        eased
      );
      lerpSpeedRef.current = 1.5;
    }

    const lerpFactor = 1 - Math.exp(-lerpSpeedRef.current * delta);
    camera.position.lerp(targetPosRef.current, lerpFactor);
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    const desiredLook = targetLookRef.current.clone().sub(camera.position).normalize();
    currentLook.lerp(desiredLook, lerpFactor);
    camera.lookAt(
      camera.position.x + currentLook.x,
      camera.position.y + currentLook.y,
      camera.position.z + currentLook.z
    );
    perspCamera.fov = THREE.MathUtils.lerp(
      perspCamera.fov,
      targetFovRef.current,
      lerpFactor
    );
    perspCamera.updateProjectionMatrix();
  });

  return null;
}
