import { motion, AnimatePresence } from 'framer-motion';
import type { Difficulty, GameStateResponse } from '../../services/api';
import { DIFFICULTY_COLORS } from '../../utils/constants';

interface DefeatOverlayProps {
  visible: boolean;
  difficulty: Difficulty;
  onRestart: (difficulty?: Difficulty) => void;
  onChangeDifficulty: (d: Difficulty) => void;
  loading: boolean;
  gameState: GameStateResponse | null;
}

const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

function computeStats(gameState: GameStateResponse | null) {
  if (!gameState) return null;
  const shotsFired = gameState.player_shots.length;
  const hits = gameState.player_shots.filter(
    (s) => s.result === 'hit' || s.result === 'sunk'
  ).length;
  const accuracy = shotsFired > 0 ? Math.round((hits / shotsFired) * 100) : 0;
  const enemyShipsSunk = 5 - gameState.ai_ships_remaining;
  const playerShipsRemaining = gameState.player_ships_remaining;
  return { shotsFired, hits, accuracy, enemyShipsSunk, playerShipsRemaining };
}

export default function DefeatOverlay({ visible, difficulty, onRestart, onChangeDifficulty, loading, gameState }: DefeatOverlayProps) {
  const stats = computeStats(gameState);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="fixed inset-0 z-30 flex flex-col items-center justify-center"
          style={{
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <motion.h1
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1, 1.05, 1], opacity: 1 }}
            transition={{
              scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 0.5 },
            }}
            className="text-7xl font-black tracking-[0.2em] uppercase mb-4"
            style={{
              color: '#ef4444',
              textShadow: '0 0 40px rgba(239,68,68,0.5), 0 0 80px rgba(239,68,68,0.3)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            DEFEAT
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm tracking-wider mb-6"
            style={{ color: '#94a3b8' }}
          >
            Our fleet has been eliminated.
          </motion.p>

          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-4 mb-8 px-6 py-4 rounded-lg"
              style={{
                background: 'rgba(2, 6, 23, 0.6)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#22d3ee' }}>Shots Fired</span>
                <span className="text-lg font-bold" style={{ color: '#e2e8f0' }}>{stats.shotsFired}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#22d3ee' }}>Hits</span>
                <span className="text-lg font-bold" style={{ color: '#e2e8f0' }}>{stats.hits}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#22d3ee' }}>Accuracy</span>
                <span className="text-lg font-bold" style={{ color: '#e2e8f0' }}>{stats.accuracy}%</span>
              </div>
              <div className="flex flex-col items-center gap-1 col-span-1">
                <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#22d3ee' }}>Enemy Sunk</span>
                <span className="text-lg font-bold" style={{ color: '#e2e8f0' }}>{stats.enemyShipsSunk}</span>
              </div>
              <div className="flex flex-col items-center gap-1 col-span-1 col-start-3">
                <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#22d3ee' }}>Ships Left</span>
                <span className="text-lg font-bold" style={{ color: '#e2e8f0' }}>{stats.playerShipsRemaining}</span>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 mb-6"
          >
            {difficulties.map((d) => (
              <button
                key={d}
                onClick={() => onChangeDifficulty(d)}
                className="px-4 py-2 rounded text-xs font-bold tracking-widest uppercase cursor-pointer transition-all hover:scale-105"
                style={{
                  background: d === difficulty ? `${DIFFICULTY_COLORS[d]}20` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${d === difficulty ? DIFFICULTY_COLORS[d] : 'rgba(255,255,255,0.1)'}`,
                  color: d === difficulty ? DIFFICULTY_COLORS[d] : '#64748b',
                }}
              >
                {d}
              </button>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => onRestart(difficulty)}
            disabled={loading}
            className="px-8 py-3 rounded-lg text-sm font-bold tracking-widest uppercase cursor-pointer transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(34, 211, 238, 0.15)',
              border: '1px solid rgba(34, 211, 238, 0.5)',
              color: '#22d3ee',
              textShadow: '0 0 10px rgba(34,211,238,0.3)',
            }}
          >
            {loading ? 'DEPLOYING...' : 'NEW BATTLE'}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
