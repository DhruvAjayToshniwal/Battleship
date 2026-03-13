import { motion, AnimatePresence } from 'framer-motion';
import type { Phase } from '../hooks/useGame';
import type { GameStateResponse } from '../services/api';

interface GameHUDProps {
  phase: Phase;
  gameState: GameStateResponse | null;
  isPlayerTurn: boolean;
  message: string;
  onRestart: () => void;
  loading: boolean;
}

export default function GameHUD({
  phase,
  gameState,
  isPlayerTurn,
  message,
  onRestart,
  loading,
}: GameHUDProps) {
  const playerShipsRemaining = gameState?.player_ships_remaining ?? 0;
  const aiShipsRemaining = gameState?.ai_ships_remaining ?? 0;
  const playerShotCount = gameState?.player_shots?.length ?? 0;
  const aiShotCount = gameState?.ai_shots?.length ?? 0;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <motion.div
          initial={{ y: -80 }}
          animate={{ y: 0 }}
          className="mt-4 px-8 py-3 rounded-lg pointer-events-auto"
          style={{
            background: 'rgba(10, 14, 26, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {phase === 'playing' && (
            <motion.div
              key={isPlayerTurn ? 'player' : 'enemy'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center mb-1 text-xs tracking-[0.3em] uppercase font-bold"
              style={{
                color: isPlayerTurn ? '#22c55e' : '#ef4444',
              }}
            >
              {isPlayerTurn ? 'YOUR TURN' : 'ENEMY TURN'}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={message}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-center text-sm tracking-wider"
              style={{ color: '#e2e8f0' }}
            >
              {message}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {phase !== 'setup' && (
        <>
          <motion.div
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="fixed left-4 top-24 z-10 p-4 rounded-lg"
            style={{
              background: 'rgba(10, 14, 26, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              minWidth: '160px',
            }}
          >
            <div
              className="text-xs tracking-[0.2em] uppercase mb-3 font-bold"
              style={{ color: '#38bdf8' }}
            >
              Your Fleet
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span style={{ color: '#94a3b8' }}>Ships</span>
                <span
                  className="font-bold"
                  style={{
                    color: playerShipsRemaining > 2 ? '#22c55e' : '#ef4444',
                  }}
                >
                  {playerShipsRemaining} / 5
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#94a3b8' }}>Hits Taken</span>
                <span style={{ color: '#e2e8f0' }}>{aiShotCount}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="fixed right-4 top-24 z-10 p-4 rounded-lg"
            style={{
              background: 'rgba(10, 14, 26, 0.85)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              minWidth: '160px',
            }}
          >
            <div
              className="text-xs tracking-[0.2em] uppercase mb-3 font-bold"
              style={{ color: '#ef4444' }}
            >
              Enemy Fleet
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span style={{ color: '#94a3b8' }}>Ships</span>
                <span
                  className="font-bold"
                  style={{
                    color: aiShipsRemaining > 2 ? '#ef4444' : '#22c55e',
                  }}
                >
                  {aiShipsRemaining} / 5
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#94a3b8' }}>Shots Fired</span>
                <span style={{ color: '#e2e8f0' }}>{playerShotCount}</span>
              </div>
            </div>
          </motion.div>
        </>
      )}

      <AnimatePresence>
        {phase === 'gameOver' && gameState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center"
            style={{ background: 'rgba(10, 14, 26, 0.85)' }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="text-center p-10 rounded-xl"
              style={{
                background: 'rgba(10, 14, 26, 0.95)',
                border: `2px solid ${
                  gameState.game_status === 'player_wins'
                    ? 'rgba(34, 197, 94, 0.5)'
                    : 'rgba(239, 68, 68, 0.5)'
                }`,
              }}
            >
              <motion.div
                className="text-5xl font-bold mb-4 tracking-widest"
                style={{
                  color:
                    gameState.game_status === 'player_wins'
                      ? '#22c55e'
                      : '#ef4444',
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {gameState.game_status === 'player_wins' ? 'VICTORY' : 'DEFEAT'}
              </motion.div>
              <p
                className="text-sm mb-8 tracking-wider"
                style={{ color: '#94a3b8' }}
              >
                {gameState.game_status === 'player_wins'
                  ? 'All enemy vessels have been destroyed.'
                  : 'Our fleet has been eliminated.'}
              </p>
              <button
                onClick={onRestart}
                disabled={loading}
                className="px-8 py-3 rounded text-sm font-bold tracking-widest cursor-pointer transition-all hover:scale-105"
                style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '2px solid #38bdf8',
                  color: '#38bdf8',
                }}
              >
                {loading ? 'DEPLOYING...' : 'NEW BATTLE'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'playing' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onRestart}
          className="fixed bottom-6 left-6 z-10 px-4 py-2 rounded text-xs tracking-wider cursor-pointer"
          style={{
            background: 'rgba(10, 14, 26, 0.8)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
          }}
        >
          RETREAT
        </motion.button>
      )}

      {phase !== 'setup' && (
        <>
          <div
            className="fixed z-10 text-xs tracking-[0.3em] uppercase font-bold"
            style={{
              color: '#38bdf8',
              opacity: 0.6,
              bottom: '20%',
              left: '25%',
              transform: 'translateX(-50%)',
            }}
          >
            YOUR WATERS
          </div>
          <div
            className="fixed z-10 text-xs tracking-[0.3em] uppercase font-bold"
            style={{
              color: '#ef4444',
              opacity: 0.6,
              bottom: '20%',
              right: '25%',
              transform: 'translateX(50%)',
            }}
          >
            ENEMY WATERS
          </div>
        </>
      )}
    </>
  );
}
