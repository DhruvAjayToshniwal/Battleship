import { motion, AnimatePresence } from 'framer-motion';
import { colors, overlay } from '../../design/theme';
import { textStyle } from '../../design/typography';
import { transition } from '../../design/motion';

interface IntroOverlayProps {
  visible: boolean;
}

export default function IntroOverlay({ visible }: IntroOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.5,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: overlay.backdrop }}
        >
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transition.fadeIn}
            style={{
              ...textStyle.display,
              color: colors.text.primary,
              marginBottom: 24,
            }}
          >
            BATTLESHIP
          </motion.h1>
          <span
            style={{
              ...textStyle.caption,
              color: colors.text.tertiary,
            }}
          >
            Initializing...
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
