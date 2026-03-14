import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../design/theme';
import { textStyle, fontFamily } from '../../design/typography';
import { ease } from '../../design/motion';

interface NetworkErrorOverlayProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function NetworkErrorOverlay({ error, onRetry, onDismiss }: NetworkErrorOverlayProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: ease.default }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-4"
          style={{
            background: 'rgba(10, 10, 10, 0.9)',
            border: `1px solid ${colors.border.hairline}`,
            maxWidth: '90vw',
          }}
        >
          <span
            style={{
              ...textStyle.body,
              color: colors.accent.red,
            }}
          >
            {error}
          </span>
          <div className="flex gap-2 ml-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-1.5 text-xs tracking-widest uppercase cursor-pointer"
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border.subtle}`,
                  color: colors.text.secondary,
                  fontFamily: fontFamily.mono,
                  transition: 'color 0.8s, border-color 0.8s',
                }}
              >
                RETRY
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-1.5 text-xs tracking-widest uppercase cursor-pointer"
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border.subtle}`,
                  color: colors.text.secondary,
                  fontFamily: fontFamily.mono,
                  transition: 'color 0.8s, border-color 0.8s',
                }}
              >
                DISMISS
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
