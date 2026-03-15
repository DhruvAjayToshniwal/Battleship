import { motion, AnimatePresence } from 'framer-motion';
import type { Phase } from '../../hooks/useBattleSequence';
import { colors } from '../../design/theme';
import { textStyle } from '../../design/typography';
import { ease } from '../../design/motion';

interface TopStatusBarProps {
  message: string;
  phase: Phase;
  isPlayerTurn: boolean;
}

export default function TopStatusBar({ message, phase, isPlayerTurn }: TopStatusBarProps) {
  return (
    <div
      className="fixed top-0 left-1/2 -translate-x-1/2 z-20 flex items-center px-5 py-2"
      style={{
        background: 'rgba(10,10,10,0.65)',
        borderBottom: `1px solid ${colors.border.hairline}`,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={message}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: ease.default }}
          style={{
            ...textStyle.caption,
            color: phase === 'playing' && isPlayerTurn ? colors.accent.silver : colors.text.secondary,
          }}
        >
          {message}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
