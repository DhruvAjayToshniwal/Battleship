import { motion, AnimatePresence } from 'framer-motion';
import type { Difficulty } from '../../services/api';
import { DIFFICULTY_COLORS } from '../../utils/constants';

interface DefeatOverlayProps {
  visible: boolean;
  difficulty: Difficulty;
  onRestart: (difficulty?: Difficulty) => void;
  onChangeDifficulty: (d: Difficulty) => void;
  loading: boolean;
}

const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

export default function DefeatOverlay({ visible, difficulty, onRestart, onChangeDifficulty, loading }: DefeatOverlayProps) {
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
            className="text-sm tracking-wider mb-10"
            style={{ color: '#94a3b8' }}
          >
            Our fleet has been eliminated.
          </motion.p>

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
