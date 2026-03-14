import { motion, AnimatePresence } from 'framer-motion';

interface LobbyOverlayProps {
  visible: boolean;
  roomCode: string;
  opponentConnected: boolean;
  onCancel: () => void;
}

export default function LobbyOverlay({ visible, roomCode, opponentConnected, onCancel }: LobbyOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'rgba(2, 6, 23, 0.95)' }}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col items-center gap-8"
          >
            <h2
              className="text-2xl font-bold tracking-[0.2em] uppercase"
              style={{ color: '#38bdf8' }}
            >
              AWAITING OPPONENT
            </h2>

            <div
              className="px-10 py-8 rounded-lg text-center"
              style={{
                background: 'rgba(10, 14, 26, 0.9)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p
                className="text-xs tracking-[0.3em] uppercase mb-4"
                style={{ color: '#64748b' }}
              >
                ROOM CODE
              </p>
              <p
                className="text-6xl font-bold tracking-[0.6em] font-mono"
                style={{
                  color: '#fbbf24',
                  textShadow: '0 0 30px rgba(251, 191, 36, 0.4), 0 0 60px rgba(251, 191, 36, 0.15)',
                }}
              >
                {roomCode}
              </p>
              <p
                className="text-xs tracking-[0.2em] uppercase mt-4"
                style={{ color: '#475569' }}
              >
                Share this code with your opponent
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: '#22c55e',
                    boxShadow: '0 0 8px #22c55e',
                  }}
                />
                <span
                  className="text-xs tracking-[0.2em] uppercase"
                  style={{ color: '#94a3b8' }}
                >
                  Player 1 (You) — Ready
                </span>
              </div>

              <div className="flex items-center gap-3">
                {opponentConnected ? (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: '#22c55e',
                      boxShadow: '0 0 8px #22c55e',
                    }}
                  />
                ) : (
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-3 h-3 rounded-full"
                    style={{ background: '#64748b' }}
                  />
                )}
                <span
                  className="text-xs tracking-[0.2em] uppercase"
                  style={{ color: opponentConnected ? '#94a3b8' : '#64748b' }}
                >
                  {opponentConnected ? 'Opponent — Joined!' : 'Player 2 — Waiting...'}
                </span>
              </div>
            </div>

            {!opponentConnected && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#38bdf8' }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#38bdf8' }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#38bdf8' }} />
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="px-6 py-2 text-xs font-bold tracking-[0.3em] uppercase cursor-pointer rounded mt-4"
              style={{
                background: 'transparent',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                color: '#64748b',
              }}
            >
              CANCEL
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
