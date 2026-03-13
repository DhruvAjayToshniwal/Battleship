import { useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import Board3D from '../components/Board3D';
import CameraController from '../components/CameraController';
import ShipPlacement from '../components/ShipPlacement';
import GameHUD from '../components/GameHUD';
import Radar from '../components/Radar';
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
    changeDifficulty,
    startGame,
    getShipPreview,
    placeShipAt,
    undoLastShip,
    autoPlace,
    confirmPlacement,
    fireShot,
  } = useGame();

  useSound();

  const [hoverCoord, setHoverCoord] = useState<[number, number] | null>(null);

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

  const handleAiBoardClick = useCallback(
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
        onPointerMissed={() => setHoverCoord(null)}
        shadows
      >
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.8}
          color="#b4c6d4"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          position={[-8, 15, -8]}
          intensity={0.15}
          color="#38bdf8"
        />
        <directionalLight
          position={[0, 5, -15]}
          intensity={0.1}
          color="#fbbf24"
        />

        <hemisphereLight
          color="#1e3a5f"
          groundColor="#0a0e1a"
          intensity={0.3}
        />

        <Environment preset="night" />

        <fog attach="fog" args={['#0a0e1a', 25, 55]} />

        <CameraController
          phase={phase}
          isPlayerTurn={isPlayerTurn}
          isFiring={isFiring}
          lastFireCoord={lastFireCoord}
          boardSpacing={boardSpacing}
        />

        <Board3D
          position={[-boardSpacing, 0, 0]}
          grid={localPlayerGrid}
          showShips={true}
          isClickable={phase === 'setup'}
          onCellClick={(row, col) => {
            handlePlayerBoardHover(row, col);
            handlePlayerBoardClick(row, col);
          }}
          shipCoordinates={playingPlayerShipCoords}
          previewCoords={previewCoords}
          latestResult={lastAiResult}
        />

        <Board3D
          position={[boardSpacing, 0, 0]}
          grid={aiGrid}
          showShips={false}
          isEnemyBoard={true}
          isClickable={phase === 'playing' && isPlayerTurn && !isFiring}
          onCellClick={handleAiBoardClick}
          latestResult={lastPlayerResult}
        />
      </Canvas>

      <GameHUD
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

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-6 py-3 rounded-lg"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!gameState && loading && phase === 'setup' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{ background: '#0a0e1a' }}
          >
            <div className="text-center">
              <motion.div
                className="text-2xl font-bold tracking-[0.5em] uppercase mb-4"
                style={{ color: '#38bdf8' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                BATTLESHIP
              </motion.div>
              <div
                className="text-xs tracking-widest"
                style={{ color: '#64748b' }}
              >
                Initializing naval command...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
