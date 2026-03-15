import { Suspense } from 'react';
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
  boardSize?: number;
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
  boardSize,
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
        boardSize={boardSize}
      />
    </QualityProvider>
  );
}

function SceneContent(props: SceneRootProps) {
  const quality = useQuality();

  // Board-local ocean uses fewer segments since it's much smaller than the global ocean
  const boardOceanSegments = Math.min(quality.oceanSegments, 48);

  return (
    <>
      <LightingRig shadowMapSize={quality.shadowMapSize} />
      <FogController near={20} far={60} />
      <SkyBackdrop />
      <Atmosphere />
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
        boardSize={props.boardSize}
        showShips={true}
        isClickable={props.isPlayerBoardClickable}
        onCellClick={props.onPlayerCellClick}
        shipCoordinates={props.playerShipCoordinates}
        previewCoords={props.previewCoords}
        latestResult={props.lastAiResult}
        oceanSegments={boardOceanSegments}
      />

      <EnemyBoard3D
        position={[props.boardSpacing, 0, 0]}
        grid={props.aiGrid}
        boardSize={props.boardSize}
        isClickable={props.isEnemyBoardClickable}
        onCellClick={props.onEnemyCellClick}
        shipCoordinates={props.enemyShipCoordinates}
        latestResult={props.lastPlayerResult}
        hoverCell={props.enemyHoverCell}
        oceanSegments={boardOceanSegments}
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
