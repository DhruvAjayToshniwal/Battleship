import { motion, AnimatePresence } from 'framer-motion';

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
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'rgba(2, 6, 23, 0.98)' }}
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 rounded-full"
                style={{
                  border: '2px solid transparent',
                  borderTopColor: '#22d3ee',
                  borderRightColor: 'rgba(34, 211, 238, 0.3)',
                }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: '#22d3ee',
                    boxShadow: '0 0 8px #22d3ee',
                  }}
                />
              </div>
            </div>

            <h2
              className="text-xl font-bold tracking-[0.2em] uppercase"
              style={{
                color: '#22d3ee',
                textShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
              }}
            >
              RECONNECTING
            </h2>

            <p
              className="text-sm tracking-[0.15em] uppercase"
              style={{ color: '#475569' }}
            >
              Restoring battle state...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
