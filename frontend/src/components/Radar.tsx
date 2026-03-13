import { motion } from 'framer-motion';

export default function Radar() {
  return (
    <div
      className="fixed bottom-6 right-6 z-10"
      style={{ width: 120, height: 120 }}
    >
      <svg
        viewBox="0 0 120 120"
        width="120"
        height="120"
        style={{ filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.3))' }}
      >
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="56"
          fill="rgba(10, 14, 26, 0.8)"
          stroke="rgba(56, 189, 248, 0.3)"
          strokeWidth="1"
        />

        {/* Grid rings */}
        {[18, 36, 54].map((r) => (
          <circle
            key={r}
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="rgba(30, 41, 59, 0.5)"
            strokeWidth="0.5"
          />
        ))}

        {/* Cross lines */}
        <line x1="4" y1="60" x2="116" y2="60" stroke="rgba(30, 41, 59, 0.5)" strokeWidth="0.5" />
        <line x1="60" y1="4" x2="60" y2="116" stroke="rgba(30, 41, 59, 0.5)" strokeWidth="0.5" />

        {/* Sweep line */}
        <motion.line
          x1="60"
          y1="60"
          x2="60"
          y2="6"
          stroke="#38bdf8"
          strokeWidth="1.5"
          opacity="0.8"
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: '60px 60px' }}
        />

        {/* Sweep trail (conic gradient simulated with arc) */}
        <motion.path
          d="M 60 60 L 60 6 A 54 54 0 0 1 98 20 Z"
          fill="url(#sweepGrad)"
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: '60px 60px' }}
        />

        <defs>
          <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Center dot */}
        <circle cx="60" cy="60" r="2" fill="#38bdf8" />

        {/* Outer ring glow */}
        <circle
          cx="60"
          cy="60"
          r="56"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="0.5"
          opacity="0.5"
        />
      </svg>

      <div
        className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] tracking-[0.2em] uppercase"
        style={{ color: '#38bdf8', opacity: 0.6 }}
      >
        RADAR
      </div>
    </div>
  );
}
