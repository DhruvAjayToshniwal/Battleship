import { motion, AnimatePresence } from 'framer-motion';
import type { Phase } from '../../hooks/useBattleSequence';

interface TopStatusBarProps {
  message: string;
  phase: Phase;
  isPlayerTurn: boolean;
}

export default function TopStatusBar({ message, phase, isPlayerTurn }: TopStatusBarProps) {
  return (
    <div
      className="fixed top-0 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-6 py-3 rounded-b-lg"
      style={{
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(34, 211, 238, 0.3)',
        borderTop: 'none',
        minWidth: '320px',
      }}
    >
      {phase === 'playing' && (
        <span
          className="text-xs font-bold tracking-widest uppercase flex-shrink-0"
          style={{
            color: isPlayerTurn ? '#22c55e' : '#ef4444',
            textShadow: isPlayerTurn ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(239,68,68,0.5)',
          }}
        >
          {isPlayerTurn ? 'YOUR TURN' : 'ENEMY TURN'}
        </span>
      )}
      <AnimatePresence mode="wait">
        <motion.span
          key={message}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
          className="text-sm tracking-wider"
          style={{ color: '#cbd5e1', fontFamily: "'Inter', sans-serif" }}
        >
          {message}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
