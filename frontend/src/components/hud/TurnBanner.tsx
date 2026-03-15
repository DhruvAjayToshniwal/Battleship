import { motion, AnimatePresence } from 'framer-motion';
import { fontFamily } from '../../design/typography';
import { ease } from '../../design/motion';

interface TurnBannerProps {
  isPlayerTurn: boolean;
  visible: boolean;
}

export default function TurnBanner({ isPlayerTurn, visible }: TurnBannerProps) {
  const label = isPlayerTurn ? 'YOUR TURN' : 'ENEMY TURN';
  const color = isPlayerTurn ? '#4ae8ff' : '#ff5555';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.5,
            ease: ease.default,
          }}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            padding: '14px 40px',
            border: `1px solid ${color}`,
            boxShadow: `0 0 30px ${color}40, 0 0 60px ${color}20`,
          }}
        >
          <span
            className="text-lg sm:text-2xl"
            style={{
              fontFamily: fontFamily.serif,
              fontWeight: 600,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color,
            }}
          >
            {label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
