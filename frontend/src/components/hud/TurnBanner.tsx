import { motion, AnimatePresence } from 'framer-motion';

interface TurnBannerProps {
  isPlayerTurn: boolean;
  visible: boolean;
}

export default function TurnBanner({ isPlayerTurn, visible }: TurnBannerProps) {
  const color = isPlayerTurn ? '#22c55e' : '#ef4444';
  const label = isPlayerTurn ? 'YOUR TURN' : 'ENEMY TURN';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 1.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none"
        >
          <span
            className="text-6xl font-black tracking-widest uppercase"
            style={{
              color,
              textShadow: `0 0 40px ${color}80, 0 0 80px ${color}40`,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
