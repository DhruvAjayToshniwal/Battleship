import { motion, AnimatePresence } from 'framer-motion';

interface FireControlPanelProps {
  visible: boolean;
  targetCoord: string | null;
  isPlayerTurn: boolean;
  isFiring: boolean;
}

export default function FireControlPanel({
  visible,
  targetCoord,
  isPlayerTurn,
  isFiring,
}: FireControlPanelProps) {
  return (
    <AnimatePresence>
      {visible && isPlayerTurn && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-20 right-6 z-20 flex flex-col items-end gap-2 pointer-events-none"
        >
          <div
            className="px-4 py-2 rounded text-xs font-bold tracking-widest uppercase"
            style={{
              background: 'rgba(10, 14, 26, 0.85)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#94a3b8',
              backdropFilter: 'blur(8px)',
            }}
          >
            {isFiring ? (
              <span style={{ color: '#fbbf24' }}>FIRING...</span>
            ) : targetCoord ? (
              <span>
                TARGET:{' '}
                <span style={{ color: '#ef4444', fontSize: '14px' }}>{targetCoord}</span>
              </span>
            ) : (
              <span>SELECT TARGET</span>
            )}
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1 rounded"
            style={{
              background: 'rgba(10, 14, 26, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: isPlayerTurn ? '#22c55e' : '#ef4444',
                boxShadow: `0 0 6px ${isPlayerTurn ? '#22c55e' : '#ef4444'}`,
              }}
            />
            <span
              className="text-[10px] tracking-widest uppercase"
              style={{ color: '#64748b' }}
            >
              {isPlayerTurn ? 'WEAPONS READY' : 'STANDBY'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
