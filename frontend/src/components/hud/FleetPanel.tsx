import { motion } from 'framer-motion';
import { colors } from '../../design/theme';
import { textStyle, fontFamily } from '../../design/typography';
import { ease } from '../../design/motion';

interface FleetPanelProps {
  title: string;
  shipsRemaining: number;
  shotsCount: number;
  accentColor: string;
  side: 'left' | 'right';
}

export default function FleetPanel({ title, shipsRemaining, shotsCount, accentColor, side }: FleetPanelProps) {
  const isLeft = side === 'left';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: ease.default }}
      className={`fixed top-24 z-20 ${isLeft ? 'left-4' : 'right-4'}`}
      style={{
        background: 'rgba(10,10,10,0.7)',
        border: `1px solid ${colors.border.hairline}`,
        padding: '14px 18px',
        minWidth: '160px',
      }}
    >
      <div
        style={{
          ...textStyle.caption,
          color: accentColor,
          marginBottom: '12px',
        }}
      >
        {title}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <span style={{ ...textStyle.caption, color: colors.text.tertiary }}>
            SHIPS
          </span>
          <span
            style={{
              fontFamily: fontFamily.mono,
              fontSize: '13px',
              color: colors.text.secondary,
            }}
          >
            {shipsRemaining} / 5
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span style={{ ...textStyle.caption, color: colors.text.tertiary }}>
            SHOTS
          </span>
          <span
            style={{
              fontFamily: fontFamily.mono,
              fontSize: '13px',
              color: colors.text.secondary,
            }}
          >
            {shotsCount}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
