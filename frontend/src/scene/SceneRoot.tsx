import { Environment } from '@react-three/drei';
import OceanSurface from './environment/OceanSurface';
import SkyBackdrop from './environment/SkyBackdrop';
import Atmosphere from './environment/Atmosphere';
import LightingRig from './environment/LightingRig';
import FogController from './environment/FogController';
import PlayerBoard3D from './boards/PlayerBoard3D';
import EnemyBoard3D from './boards/EnemyBoard3D';
import MainCameraRig from './cameras/MainCameraRig';
import type { Phase } from '../hooks/useBattleSequence';
import type { ShotResult } from '../services/api';

interface SceneRootProps {
  phase: Phase;
  isPlayerTurn: boolean;
  isFiring: boolean;
  lastFireCoord: string | null;
  boardSpacing: number;
  playerGrid: (string | null)[][];
  aiGrid: (string | null)[][];
  playerShipCoordinates: string[][];
  previewCoords: string[] | null;
  lastPlayerResult: ShotResult | null;
  lastAiResult: ShotResult | null;
  isPlayerBoardClickable: boolean;
  isEnemyBoardClickable: boolean;
  onPlayerCellClick?: (row: number, col: number, coord: string) => void;
  onEnemyCellClick?: (row: number, col: number, coord: string) => void;
  enemyHoverCell?: [number, number] | null;
}

export default function SceneRoot({
  phase,
  isPlayerTurn,
  isFiring,
  lastFireCoord,
  boardSpacing,
  playerGrid,
  aiGrid,
  playerShipCoordinates,
  previewCoords,
  lastPlayerResult,
  lastAiResult,
  isPlayerBoardClickable,
  isEnemyBoardClickable,
  onPlayerCellClick,
  onEnemyCellClick,
  enemyHoverCell,
}: SceneRootProps) {
  return (
    <>
      <LightingRig />
      <Environment preset="night" />
      <FogController near={20} far={60} />
      <SkyBackdrop />
      <Atmosphere />
      <OceanSurface position={[0, -0.15, 0]} size={[80, 80]} segments={192} />

      <MainCameraRig
        phase={phase}
        isPlayerTurn={isPlayerTurn}
        isFiring={isFiring}
        lastFireCoord={lastFireCoord}
        boardSpacing={boardSpacing}
      />

      <PlayerBoard3D
        position={[-boardSpacing, 0, 0]}
        grid={playerGrid}
        showShips={true}
        isClickable={isPlayerBoardClickable}
        onCellClick={onPlayerCellClick}
        shipCoordinates={playerShipCoordinates}
        previewCoords={previewCoords}
        latestResult={lastAiResult}
      />

      <EnemyBoard3D
        position={[boardSpacing, 0, 0]}
        grid={aiGrid}
        isClickable={isEnemyBoardClickable}
        onCellClick={onEnemyCellClick}
        latestResult={lastPlayerResult}
        hoverCell={enemyHoverCell}
      />
    </>
  );
}
