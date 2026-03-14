import { motion, AnimatePresence } from 'framer-motion';
import { colors, overlay } from '../../design/theme';
import { textStyle, fontFamily } from '../../design/typography';
import { transition, ease } from '../../design/motion';

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
          transition={transition.fadeIn}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: overlay.backdrop }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 1.2, ease: ease.default }}
            className="flex flex-col items-center gap-8"
          >
            <h2
              style={{
                ...textStyle.title,
                color: colors.text.secondary,
              }}
            >
              AWAITING OPPONENT
            </h2>

            <div
              className="px-10 py-8 text-center"
              style={{
                background: colors.bg.deep,
                border: `1px solid ${colors.border.hairline}`,
              }}
            >
              <p
                style={{
                  ...textStyle.caption,
                  color: colors.text.tertiary,
                  marginBottom: 16,
                }}
              >
                ROOM CODE
              </p>
              <p
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: '48px',
                  color: colors.accent.warmWhite,
                  letterSpacing: '0.5em',
                  fontWeight: 300,
                }}
              >
                {roomCode}
              </p>
              <p
                style={{
                  ...textStyle.caption,
                  color: colors.text.tertiary,
                  marginTop: 16,
                }}
              >
                Share this code with your opponent
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <span
                  style={{
                    ...textStyle.caption,
                    color: colors.text.secondary,
                  }}
                >
                  Player 1 (You) — Ready
                </span>
              </div>

              <div className="flex items-center gap-3">
                {opponentConnected ? (
                  <span
                    style={{
                      ...textStyle.caption,
                      color: colors.text.secondary,
                    }}
                  >
                    Opponent — Joined
                  </span>
                ) : (
                  <motion.span
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: ease.default }}
                    style={{
                      ...textStyle.caption,
                      color: colors.text.tertiary,
                    }}
                  >
                    Player 2 — Waiting...
                  </motion.span>
                )}
              </div>
            </div>

            {!opponentConnected && (
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: ease.default }}
                className="flex items-center gap-2"
              >
                <span style={{ color: colors.text.tertiary }}>...</span>
              </motion.div>
            )}

            <button
              onClick={onCancel}
              className="px-6 py-2 text-xs tracking-widest uppercase cursor-pointer mt-4"
              style={{
                background: 'transparent',
                border: `1px solid ${colors.border.subtle}`,
                color: colors.text.tertiary,
                fontFamily: fontFamily.mono,
                transition: 'color 0.8s, border-color 0.8s',
              }}
            >
              CANCEL
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
