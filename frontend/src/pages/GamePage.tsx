import { useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import SceneRoot from '../scene/SceneRoot';
import ShipPlacement from '../components/ShipPlacement';
import CommandHUD from '../components/hud/CommandHUD';
import Radar from '../components/Radar';
import VictoryOverlay from '../components/overlays/VictoryOverlay';
import DefeatOverlay from '../components/overlays/DefeatOverlay';
import LoadingOverlay from '../components/overlays/LoadingOverlay';
import NetworkErrorOverlay from '../components/overlays/NetworkErrorOverlay';
import type { Difficulty } from '../services/api';

export default function GamePage() {
  const {
    gameState,
    loading,
    error,
    phase,
    orientation,
    placedShips,
    currentShip,
    currentShipIndex,
    allShipsPlaced,
    shipsToPlace,
    localPlayerGrid,
    aiGrid,
    lastPlayerResult,
    lastAiResult,
    isPlayerTurn,
    isFiring,
    message,
    difficulty,
    clearError,
    changeDifficulty,
    startGame,
    getShipPreview,
    placeShipAt,
    undoLastShip,
    autoPlace,
    confirmPlacement,
    fireShot,
  } = useGame();

  const [hoverCoord, setHoverCoord] = useState<[number, number] | null>(null);
  const [enemyHoverCell, setEnemyHoverCell] = useState<[number, number] | null>(null);

  useEffect(() => {
    startGame();
  }, []);

  const previewCoords = useMemo(() => {
    if (phase !== 'setup' || !hoverCoord || !currentShip) return null;
    return getShipPreview(hoverCoord[0], hoverCoord[1]);
  }, [phase, hoverCoord, currentShip, getShipPreview]);

  const handlePlayerBoardClick = useCallback(
    (row: number, col: number) => {
      if (phase === 'setup') {
        setHoverCoord([row, col]);
        placeShipAt(row, col);
      }
    },
    [phase, placeShipAt]
  );

  const handlePlayerBoardHover = useCallback(
    (row: number, col: number) => {
      if (phase === 'setup') {
        setHoverCoord([row, col]);
      }
    },
    [phase]
  );

  const handleEnemyCellClick = useCallback(
    (...args: [number, number, string]) => {
      const coordinate = args[2];
      if (phase === 'playing' && isPlayerTurn && !isFiring) {
        fireShot(coordinate);
      }
    },
    [phase, isPlayerTurn, isFiring, fireShot]
  );

  const handleRestart = useCallback(
    (diff?: Difficulty) => {
      startGame(diff);
    },
    [startGame]
  );

  const playerShipCoords = placedShips.map((s) => s.coordinates);

  const playingPlayerShipCoords = useMemo(() => {
    if (phase !== 'setup' && gameState?.player_board?.ships) {
      return gameState.player_board.ships
        .filter((s) => s.coordinates)
        .map((s) => s.coordinates);
    }
    return playerShipCoords;
  }, [phase, gameState, playerShipCoords]);

  const lastFireCoord = lastPlayerResult?.coordinate ?? null;
  const boardSpacing = 7;

  const isPlayerWin = gameState?.game_status === 'player_wins';
  const isAiWin = gameState?.game_status === 'ai_wins';

  return (
    <div className="w-full h-full relative" style={{ background: '#0a0e1a' }}>
      <Canvas
        camera={{
          position: [0, 35, 30],
          fov: 50,
          near: 0.1,
          far: 200,
        }}
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={() => {
          setHoverCoord(null);
          setEnemyHoverCell(null);
        }}
        shadows
      >
        <SceneRoot
          phase={phase}
          isPlayerTurn={isPlayerTurn}
          isFiring={isFiring}
          lastFireCoord={lastFireCoord}
          boardSpacing={boardSpacing}
          playerGrid={localPlayerGrid}
          aiGrid={aiGrid}
          playerShipCoordinates={playingPlayerShipCoords}
          previewCoords={previewCoords}
          lastPlayerResult={lastPlayerResult}
          lastAiResult={lastAiResult}
          isPlayerBoardClickable={phase === 'setup'}
          isEnemyBoardClickable={phase === 'playing' && isPlayerTurn && !isFiring}
          onPlayerCellClick={(row, col) => {
            handlePlayerBoardHover(row, col);
            handlePlayerBoardClick(row, col);
          }}
          onEnemyCellClick={handleEnemyCellClick}
          enemyHoverCell={enemyHoverCell}
        />
      </Canvas>

      <CommandHUD
        phase={phase}
        gameState={gameState}
        isPlayerTurn={isPlayerTurn}
        message={message}
        difficulty={difficulty}
        onRestart={handleRestart}
        onChangeDifficulty={changeDifficulty}
        loading={loading}
      />

      <AnimatePresence>
        {phase === 'setup' && (
          <ShipPlacement
            shipsToPlace={shipsToPlace}
            currentShipIndex={currentShipIndex}
            placedShips={placedShips}
            allShipsPlaced={allShipsPlaced}
            orientation={orientation}
            difficulty={difficulty}
            onChangeDifficulty={changeDifficulty}
            onAutoPlace={autoPlace}
            onConfirm={confirmPlacement}
            onUndo={undoLastShip}
            loading={loading}
          />
        )}
      </AnimatePresence>

      {phase === 'playing' && <Radar />}

      <VictoryOverlay
        visible={phase === 'gameOver' && isPlayerWin}
        difficulty={difficulty}
        onRestart={handleRestart}
        onChangeDifficulty={changeDifficulty}
        loading={loading}
      />

      <DefeatOverlay
        visible={phase === 'gameOver' && isAiWin}
        difficulty={difficulty}
        onRestart={handleRestart}
        onChangeDifficulty={changeDifficulty}
        loading={loading}
      />

      <NetworkErrorOverlay
        error={error}
        onRetry={() => startGame()}
        onDismiss={clearError}
      />

      <LoadingOverlay
        visible={!gameState && loading && phase === 'setup'}
        message="Initializing naval command..."
      />
    </div>
  );
}
