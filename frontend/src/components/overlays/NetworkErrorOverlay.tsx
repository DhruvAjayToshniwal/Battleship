import { motion, AnimatePresence } from 'framer-motion';

interface NetworkErrorOverlayProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function NetworkErrorOverlay({
  error,
  onRetry,
  onDismiss,
}: NetworkErrorOverlayProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-lg"
          style={{
            background: 'rgba(20, 10, 10, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            backdropFilter: 'blur(8px)',
            maxWidth: '90vw',
          }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }}
          />
          <span className="text-sm" style={{ color: '#fca5a5' }}>
            {error}
          </span>
          <div className="flex gap-2 ml-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1 rounded text-xs tracking-wider cursor-pointer transition-all hover:scale-105"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                }}
              >
                RETRY
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-1 rounded text-xs tracking-wider cursor-pointer transition-all hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
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
