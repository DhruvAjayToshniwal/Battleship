import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Phase } from '../hooks/useBattleSequence';

type CinematicMode = 'intro' | 'idle' | 'playerFire' | 'enemyFire' | 'victory' | 'defeat';

interface CameraControllerProps {
  phase: Phase;
  isPlayerTurn: boolean;
  isFiring: boolean;
  lastFireCoord?: string | null;
  boardSpacing: number;
}

const LERP_SPEED = 1.8;

const CAMERA_PRESETS = {
  intro_start: { pos: [0, 35, 30], target: [0, 0, 0] },
  intro_end: { pos: [0, 18, 16], target: [0, 0, 0] },
  setup: { pos: [-7, 16, 14], target: [-7, 0, 0] },
  playing: { pos: [0, 18, 16], target: [0, 0, 0] },
  playerBoard: { pos: [-7, 14, 12], target: [-7, 0, 0] },
  enemyBoard: { pos: [7, 14, 12], target: [7, 0, 0] },
  victory: { pos: [0, 12, 18], target: [0, 0, 0] },
  defeat: { pos: [0, 22, 20], target: [0, 0, 0] },
} as const;

function coordToWorldPos(coord: string, boardOffset: number): [number, number, number] {
  const col = coord.charCodeAt(0) - 65;
  const row = parseInt(coord.slice(1), 10) - 1;
  return [col - 5 + 0.5 + boardOffset, 2, row - 5 + 0.5];
}

export default function CameraController({
  phase,
  isPlayerTurn,
  isFiring,
  lastFireCoord,
  boardSpacing,
}: CameraControllerProps) {
  const { camera, size } = useThree();
  const modeRef = useRef<CinematicMode>('intro');
  const timeRef = useRef(0);
  const targetPos = useRef(new THREE.Vector3(0, 35, 30));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));
  const introComplete = useRef(false);
  const victoryAngle = useRef(0);
  const orbitEnabled = useRef(true);

  const aspect = size.width / size.height;
  const heightBoost = aspect < 1.2 ? 1.3 : aspect < 1.5 ? 1.15 : 1.0;
  const distBoost = aspect < 1.2 ? 1.25 : aspect < 1.5 ? 1.1 : 1.0;

  const setPreset = useCallback((key: keyof typeof CAMERA_PRESETS) => {
    const preset = CAMERA_PRESETS[key];
    targetPos.current.set(
      preset.pos[0],
      preset.pos[1] * heightBoost,
      preset.pos[2] * distBoost
    );
    targetLook.current.set(preset.target[0], preset.target[1], preset.target[2]);
  }, [heightBoost, distBoost]);

  useEffect(() => {
    if (phase === 'setup') {
      if (!introComplete.current) {
        modeRef.current = 'intro';
        timeRef.current = 0;
        targetPos.current.set(0, 35, 30);
        camera.position.set(0, 35, 30);
      } else {
        modeRef.current = 'idle';
        setPreset('setup');
      }
    } else if (phase === 'playing') {
      modeRef.current = 'idle';
      setPreset('playing');
      orbitEnabled.current = true;
    } else if (phase === 'gameOver') {
      orbitEnabled.current = false;
    }
  }, [phase, camera, setPreset]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (isFiring && lastFireCoord) {
      modeRef.current = 'playerFire';
      timeRef.current = 0;
      const worldPos = coordToWorldPos(lastFireCoord, boardSpacing);
      targetPos.current.set(worldPos[0] + 3, 8 * heightBoost, worldPos[2] + 6 * distBoost);
      targetLook.current.set(worldPos[0], worldPos[1], worldPos[2]);
    } else if (!isFiring && !isPlayerTurn) {
      modeRef.current = 'enemyFire';
      timeRef.current = 0;
      setPreset('playerBoard');
    } else if (isPlayerTurn && !isFiring) {
      modeRef.current = 'idle';
      setPreset('playing');
    }
  }, [isFiring, isPlayerTurn, lastFireCoord, phase, boardSpacing, setPreset, heightBoost, distBoost]);

  useEffect(() => {
    if (phase === 'gameOver') {
      timeRef.current = 0;
      victoryAngle.current = 0;
    }
  }, [phase]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (modeRef.current === 'intro') {
      const progress = Math.min(t / 3.0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const startPos = CAMERA_PRESETS.intro_start.pos;
      const endPos = CAMERA_PRESETS.setup.pos;

      targetPos.current.set(
        startPos[0] + (endPos[0] - startPos[0]) * eased,
        (startPos[1] + (endPos[1] - startPos[1]) * eased) * heightBoost,
        (startPos[2] + (endPos[2] - startPos[2]) * eased) * distBoost
      );
      targetLook.current.set(
        CAMERA_PRESETS.setup.target[0],
        CAMERA_PRESETS.setup.target[1],
        CAMERA_PRESETS.setup.target[2]
      );

      if (progress >= 1) {
        introComplete.current = true;
        modeRef.current = 'idle';
      }
    }

    if (phase === 'gameOver') {
      victoryAngle.current += delta * 0.3;
      const radius = 22 * distBoost;
      const angle = victoryAngle.current;
      targetPos.current.set(
        Math.sin(angle) * radius,
        (12 + Math.sin(angle * 0.5) * 3) * heightBoost,
        Math.cos(angle) * radius
      );
      targetLook.current.set(0, 0, 0);
    }

    if (modeRef.current === 'playerFire' && t > 2.5) {
      modeRef.current = 'idle';
      setPreset('playing');
    }

    if (modeRef.current === 'enemyFire' && t > 2.0) {
      modeRef.current = 'idle';
      setPreset('playing');
    }

    const speed = modeRef.current === 'intro' ? 3.0 : LERP_SPEED;
    camera.position.lerp(targetPos.current, speed * delta);
    currentLook.current.lerp(targetLook.current, speed * delta);
    camera.lookAt(currentLook.current);
  });

  return null;
}
