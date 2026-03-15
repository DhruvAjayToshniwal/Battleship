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
      className={`fixed top-12 sm:top-24 z-20 ${isLeft ? 'left-2 sm:left-4' : 'right-2 sm:right-4'}`}
      style={{
        background: 'rgba(10,10,10,0.7)',
        border: `1px solid ${colors.border.hairline}`,
        padding: '10px 12px',
      }}
    >
      <div
        className="text-[9px] sm:text-[11px]"
        style={{
          ...textStyle.caption,
          color: accentColor,
          marginBottom: '8px',
        }}
      >
        {title}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <span className="text-[9px] sm:text-[11px]" style={{ ...textStyle.caption, color: colors.text.tertiary }}>
            SHIPS
          </span>
          <span
            style={{
              fontFamily: fontFamily.mono,
              fontSize: '12px',
              color: colors.text.secondary,
            }}
          >
            {shipsRemaining} / 5
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <span className="text-[9px] sm:text-[11px]" style={{ ...textStyle.caption, color: colors.text.tertiary }}>
            SHOTS
          </span>
          <span
            style={{
              fontFamily: fontFamily.mono,
              fontSize: '12px',
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
