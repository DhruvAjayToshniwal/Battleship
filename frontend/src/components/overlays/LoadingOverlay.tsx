import { motion, AnimatePresence } from 'framer-motion';

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
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(2, 6, 23, 0.9)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-lg tracking-widest uppercase font-bold"
            style={{
              color: '#22d3ee',
              textShadow: '0 0 20px rgba(34,211,238,0.3)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {message}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
