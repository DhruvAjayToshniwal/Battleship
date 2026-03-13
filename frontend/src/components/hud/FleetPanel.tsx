import { motion } from 'framer-motion';

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
      initial={{ x: isLeft ? -120 : 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 120 }}
      className={`fixed top-24 z-20 ${isLeft ? 'left-4' : 'right-4'}`}
      style={{
        background: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${accentColor}40`,
        borderRadius: '8px',
        padding: '14px 18px',
        minWidth: '160px',
      }}
    >
      <div
        className="text-xs font-bold tracking-widest uppercase mb-3"
        style={{ color: accentColor }}
      >
        {title}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs tracking-wider" style={{ color: '#64748b' }}>
            SHIPS
          </span>
          <span
            className="text-sm font-bold"
            style={{
              color: shipsRemaining > 2 ? '#22c55e' : shipsRemaining > 0 ? '#fbbf24' : '#ef4444',
            }}
          >
            {shipsRemaining} / 5
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs tracking-wider" style={{ color: '#64748b' }}>
            SHOTS
          </span>
          <span className="text-sm font-bold" style={{ color: '#cbd5e1' }}>
            {shotsCount}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
