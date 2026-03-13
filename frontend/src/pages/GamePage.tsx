import { useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import Board3D from '../components/Board3D';
import ShipPlacement from '../components/ShipPlacement';
import GameHUD from '../components/GameHUD';
import Radar from '../components/Radar';

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

  const playerShipCoords = placedShips.map((s) => s.coordinates);

  const playingPlayerShipCoords = useMemo(() => {
    if (phase !== 'setup' && gameState?.player_board?.ships) {
      return gameState.player_board.ships
        .filter((s) => s.coordinates)
        .map((s) => s.coordinates);
    }
    return playerShipCoords;
  }, [phase, gameState, playerShipCoords]);

  const boardSpacing = 7;

  return (
    <div className="w-full h-full relative" style={{ background: '#0a0e1a' }}>
      <Canvas
        camera={{
          position: [0, 18, 16],
          fov: 50,
          near: 0.1,
          far: 200,
        }}
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={() => setHoverCoord(null)}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.6}
          color="#94a3b8"
        />
        <directionalLight
          position={[-5, 10, -5]}
          intensity={0.2}
          color="#38bdf8"
        />

        <fog attach="fog" args={['#0a0e1a', 30, 60]} />

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
          isClickable={phase === 'playing' && isPlayerTurn && !isFiring}
          onCellClick={handleAiBoardClick}
          latestResult={lastPlayerResult}
        />

        <OrbitControls
          enablePan={false}
          minDistance={12}
          maxDistance={40}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2.5}
          target={[0, 0, 0]}
        />
      </Canvas>

      <GameHUD
        phase={phase}
        gameState={gameState}
        isPlayerTurn={isPlayerTurn}
        message={message}
        onRestart={startGame}
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
