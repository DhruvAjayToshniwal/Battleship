import { motion, AnimatePresence } from 'framer-motion';
import { overlay } from '../../design/theme';
import { colors } from '../../design/theme';
import { textStyle } from '../../design/typography';
import { transition, ease } from '../../design/motion';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition.fadeIn}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: overlay.backdrop }}
        >
          <motion.span
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: ease.default }}
            style={{
              ...textStyle.caption,
              color: colors.text.secondary,
            }}
          >
            {message}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
