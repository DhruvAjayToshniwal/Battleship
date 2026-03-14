import { motion, AnimatePresence } from 'framer-motion';
import { colors, overlay } from '../../design/theme';
import { textStyle } from '../../design/typography';
import { transition, ease } from '../../design/motion';

interface ReconnectOverlayProps {
  visible: boolean;
}

export default function ReconnectOverlay({ visible }: ReconnectOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition.fadeIn}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: overlay.backdrop }}
        >
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: ease.default }}
            className="flex flex-col items-center gap-6"
          >
            <h2
              style={{
                ...textStyle.title,
                color: colors.text.secondary,
                letterSpacing: '0.2em',
              }}
            >
              RECONNECTING
            </h2>

            <p
              style={{
                ...textStyle.caption,
                color: colors.text.tertiary,
              }}
            >
              Restoring battle state...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
