import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../design/theme';
import { textStyle, fontFamily } from '../../design/typography';
import { ease } from '../../design/motion';

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: ease.default }}
          className="fixed bottom-8 right-6 z-20 flex flex-col items-end gap-2 pointer-events-none"
        >
          <div
            style={{
              padding: '8px 16px',
              border: `1px solid ${colors.border.hairline}`,
            }}
          >
            {isFiring ? (
              <span style={{ ...textStyle.caption, color: colors.text.tertiary }}>
                FIRING...
              </span>
            ) : targetCoord ? (
              <span style={{ ...textStyle.caption, color: colors.text.tertiary }}>
                TARGET:{' '}
                <span style={{ fontFamily: fontFamily.mono, fontSize: '14px', color: colors.text.secondary }}>
                  {targetCoord}
                </span>
              </span>
            ) : (
              <span style={{ ...textStyle.caption, color: colors.text.tertiary }}>
                SELECT TARGET
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
