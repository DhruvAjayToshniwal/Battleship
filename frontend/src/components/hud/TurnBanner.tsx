import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../design/theme';
import { fontFamily } from '../../design/typography';
import { ease } from '../../design/motion';

interface TurnBannerProps {
  isPlayerTurn: boolean;
  visible: boolean;
}

export default function TurnBanner({ isPlayerTurn, visible }: TurnBannerProps) {
  const label = isPlayerTurn ? 'YOUR TURN' : 'ENEMY TURN';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.6,
            ease: ease.default,
          }}
          className="fixed inset-0 z-30 flex items-end justify-center pointer-events-none"
          style={{ paddingBottom: '35vh' }}
        >
          <span
            className="text-xl sm:text-4xl"
            style={{
              fontFamily: fontFamily.serif,
              fontWeight: 300,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: colors.text.primary,
            }}
          >
            {label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
