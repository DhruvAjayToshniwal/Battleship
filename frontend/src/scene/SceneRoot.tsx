import { Suspense } from 'react';
import OceanSurface from './environment/OceanSurface';
import SkyBackdrop from './environment/SkyBackdrop';
import Atmosphere from './environment/Atmosphere';
import LightingRig from './environment/LightingRig';
import FogController from './environment/FogController';
import PlayerBoard3D from './boards/PlayerBoard3D';
import EnemyBoard3D from './boards/EnemyBoard3D';
import MainCameraRig from './cameras/MainCameraRig';
import PostStack from './post/PostStack';
import { QualityProvider, useQuality } from './QualityProvider';
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
  enemyShipCoordinates: string[][];
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
  enemyShipCoordinates,
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
    <QualityProvider>
      <SceneContent
        phase={phase}
        isPlayerTurn={isPlayerTurn}
        isFiring={isFiring}
        lastFireCoord={lastFireCoord}
        boardSpacing={boardSpacing}
        playerGrid={playerGrid}
        aiGrid={aiGrid}
        playerShipCoordinates={playerShipCoordinates}
        enemyShipCoordinates={enemyShipCoordinates}
        previewCoords={previewCoords}
        lastPlayerResult={lastPlayerResult}
        lastAiResult={lastAiResult}
        isPlayerBoardClickable={isPlayerBoardClickable}
        isEnemyBoardClickable={isEnemyBoardClickable}
        onPlayerCellClick={onPlayerCellClick}
        onEnemyCellClick={onEnemyCellClick}
        enemyHoverCell={enemyHoverCell}
      />
    </QualityProvider>
  );
}

function SceneContent(props: SceneRootProps) {
  const quality = useQuality();

  return (
    <>
      <LightingRig shadowMapSize={quality.shadowMapSize} />
      <FogController near={20} far={60} />
      <SkyBackdrop />
      <Atmosphere />
      <OceanSurface position={[0, -0.15, 0]} size={[50, 50]} segments={quality.oceanSegments} />

      <MainCameraRig
        phase={props.phase}
        isPlayerTurn={props.isPlayerTurn}
        isFiring={props.isFiring}
        lastFireCoord={props.lastFireCoord}
        boardSpacing={props.boardSpacing}
      />

      <PlayerBoard3D
        position={[-props.boardSpacing, 0, 0]}
        grid={props.playerGrid}
        showShips={true}
        isClickable={props.isPlayerBoardClickable}
        onCellClick={props.onPlayerCellClick}
        shipCoordinates={props.playerShipCoordinates}
        previewCoords={props.previewCoords}
        latestResult={props.lastAiResult}
      />

      <EnemyBoard3D
        position={[props.boardSpacing, 0, 0]}
        grid={props.aiGrid}
        isClickable={props.isEnemyBoardClickable}
        onCellClick={props.onEnemyCellClick}
        shipCoordinates={props.enemyShipCoordinates}
        latestResult={props.lastPlayerResult}
        hoverCell={props.enemyHoverCell}
      />

      <Suspense fallback={null}>
        <PostStack
          enableBloom={quality.enableBloom}
          enableVignette={quality.enableVignette}
        />
      </Suspense>
    </>
  );
}
