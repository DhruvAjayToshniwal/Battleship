import { motion, AnimatePresence } from 'framer-motion';

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
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 120 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-4 rounded-lg"
          style={{
            background: 'rgba(2, 6, 23, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            backdropFilter: 'blur(12px)',
            maxWidth: '90vw',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.1)',
          }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: '#ef4444',
              boxShadow: '0 0 8px #ef4444, 0 0 16px rgba(239,68,68,0.3)',
            }}
          />
          <span
            className="text-sm tracking-wider"
            style={{ color: '#fca5a5', fontFamily: "'Inter', sans-serif" }}
          >
            {error}
          </span>
          <div className="flex gap-2 ml-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-1.5 rounded text-xs font-bold tracking-widest uppercase cursor-pointer transition-all hover:scale-105"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  textShadow: '0 0 8px rgba(239,68,68,0.3)',
                }}
              >
                RETRY
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-1.5 rounded text-xs font-bold tracking-widest uppercase cursor-pointer transition-all hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#64748b',
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
