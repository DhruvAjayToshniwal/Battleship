import { motion, AnimatePresence } from 'framer-motion';

interface IntroOverlayProps {
  visible: boolean;
}

export default function IntroOverlay({ visible }: IntroOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'rgba(2, 6, 23, 0.98)' }}
        >
          <motion.h1
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-5xl font-black tracking-[0.3em] uppercase mb-6"
            style={{
              color: '#22d3ee',
              textShadow: '0 0 30px rgba(34,211,238,0.4), 0 0 60px rgba(34,211,238,0.2)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            BATTLESHIP
          </motion.h1>
          <span
            className="text-sm tracking-widest uppercase"
            style={{ color: '#475569' }}
          >
            Initializing naval command...
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
