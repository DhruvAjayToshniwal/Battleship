import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Shot {
  coordinate: string;
  result: string;
}

interface RadarProps {
  playerShots?: Shot[];
  aiShots?: Shot[];
}

function coordToRadar(coordinate: string): { x: number; y: number } {
  const letter = coordinate.charAt(0).toUpperCase();
  const num = parseInt(coordinate.slice(1), 10);
  const col = letter.charCodeAt(0) - 65;
  const row = num - 1;
  const gridX = (col / 9) * 2 - 1;
  const gridY = (row / 9) * 2 - 1;
  const cx = 50;
  const cy = 50;
  const maxR = 44;
  return {
    x: cx + gridX * maxR * 0.5,
    y: cy + gridY * maxR * 0.5,
  };
}

function getDotColor(source: 'player' | 'ai', result: string): string {
  if (source === 'player') {
    return result === 'hit' || result === 'sunk' ? '#ef4444' : 'rgba(56, 189, 248, 0.35)';
  }
  return result === 'hit' || result === 'sunk' ? '#f97316' : 'rgba(100, 116, 139, 0.4)';
}

function getDotRadius(result: string): number {
  return result === 'hit' || result === 'sunk' ? 2.5 : 1.8;
}

export default function Radar({ playerShots = [], aiShots = [] }: RadarProps) {
  const [pings, setPings] = useState<{ id: string; x: number; y: number; color: string }[]>([]);
  const prevCountRef = useRef(0);

  const totalCount = playerShots.length + aiShots.length;

  useEffect(() => {
    if (totalCount > prevCountRef.current) {
      const allShots: { shot: Shot; source: 'player' | 'ai' }[] = [
        ...playerShots.map((s) => ({ shot: s, source: 'player' as const })),
        ...aiShots.map((s) => ({ shot: s, source: 'ai' as const })),
      ];
      const newShots = allShots.slice(prevCountRef.current);
      const newPings = newShots.map(({ shot, source }) => {
        const pos = coordToRadar(shot.coordinate);
        return {
          id: `${shot.coordinate}-${Date.now()}-${Math.random()}`,
          x: pos.x,
          y: pos.y,
          color: getDotColor(source, shot.result),
        };
      });
      setPings((prev) => [...prev, ...newPings]);
      setTimeout(() => {
        setPings((prev) => prev.filter((p) => !newPings.find((np) => np.id === p.id)));
      }, 1200);
    }
    prevCountRef.current = totalCount;
  }, [totalCount, playerShots, aiShots]);

  return (
    <div
      className="fixed bottom-8 left-6 z-10"
      style={{ width: 100, height: 100 }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100"
        height="100"
        style={{ filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.3))' }}
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="rgba(10, 14, 26, 0.8)"
          stroke="rgba(56, 189, 248, 0.3)"
          strokeWidth="1"
        />

        {[15, 30, 45].map((r) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgba(30, 41, 59, 0.5)"
            strokeWidth="0.5"
          />
        ))}

        <line x1="4" y1="50" x2="96" y2="50" stroke="rgba(30, 41, 59, 0.5)" strokeWidth="0.5" />
        <line x1="50" y1="4" x2="50" y2="96" stroke="rgba(30, 41, 59, 0.5)" strokeWidth="0.5" />

        {playerShots.map((shot) => {
          const pos = coordToRadar(shot.coordinate);
          const color = getDotColor('player', shot.result);
          const r = getDotRadius(shot.result);
          return (
            <circle
              key={`p-${shot.coordinate}`}
              cx={pos.x}
              cy={pos.y}
              r={r}
              fill={color}
              opacity={0.9}
            />
          );
        })}

        {aiShots.map((shot) => {
          const pos = coordToRadar(shot.coordinate);
          const color = getDotColor('ai', shot.result);
          const r = getDotRadius(shot.result);
          return (
            <circle
              key={`a-${shot.coordinate}`}
              cx={pos.x}
              cy={pos.y}
              r={r}
              fill={color}
              opacity={0.9}
            />
          );
        })}

        <AnimatePresence>
          {pings.map((ping) => (
            <motion.circle
              key={ping.id}
              cx={ping.x}
              cy={ping.y}
              r={2}
              fill="none"
              stroke={ping.color}
              strokeWidth={1.5}
              initial={{ r: 2, opacity: 1 }}
              animate={{ r: 12, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        <motion.line
          x1="50"
          y1="50"
          x2="50"
          y2="5"
          stroke="#38bdf8"
          strokeWidth="1.5"
          opacity="0.8"
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: '50px 50px' }}
        />

        <motion.path
          d="M 50 50 L 50 5 A 45 45 0 0 1 82 18 Z"
          fill="url(#sweepGrad)"
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: '50px 50px' }}
        />

        <defs>
          <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="2" fill="#38bdf8" />

        <circle
          cx="50"
          cy="50"
          r="46"
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
