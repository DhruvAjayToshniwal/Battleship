import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribe } from '../../hooks/useVoiceCommander';
import type { VoiceEvent } from '../../hooks/useVoiceCommander';

const EVENT_STYLES: Record<string, { color: string; glow: string }> = {
  playerHit: { color: '#00ff88', glow: '#00ff8860' },
  playerMiss: { color: '#64748b', glow: '#64748b40' },
  playerSunk: { color: '#fbbf24', glow: '#fbbf2460' },
  enemyHit: { color: '#ef4444', glow: '#ef444460' },
  enemyMiss: { color: '#38bdf8', glow: '#38bdf860' },
  enemySunk: { color: '#ff0000', glow: '#ff000060' },
  firing: { color: '#ff8800', glow: '#ff880060' },
  victory: { color: '#fbbf24', glow: '#fbbf2480' },
  defeat: { color: '#ef4444', glow: '#ef444480' },
  turnStart: { color: '#00e5ff', glow: '#00e5ff40' },
  gameStart: { color: '#00e5ff', glow: '#00e5ff60' },
};

interface Callout {
  id: number;
  text: string;
  event: VoiceEvent;
}

let nextId = 0;

export default function CommanderCallout() {
  const [callout, setCallout] = useState<Callout | null>(null);

  useEffect(() => {
    return subscribe((text, event) => {
      const id = nextId++;
      setCallout({ id, text, event });
      setTimeout(() => {
        setCallout((prev) => (prev?.id === id ? null : prev));
      }, 1800);
    });
  }, []);

  const style = callout ? EVENT_STYLES[callout.event] ?? EVENT_STYLES.firing : EVENT_STYLES.firing;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-30">
      <AnimatePresence mode="wait">
        {callout && (
          <motion.div
            key={callout.id}
            initial={{ opacity: 0, scale: 1.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              color: style.color,
              textShadow: `0 0 30px ${style.glow}, 0 0 60px ${style.glow}, 0 2px 4px rgba(0,0,0,0.8)`,
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              fontSize: 'clamp(1.5rem, 4vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '0.15em',
              textAlign: 'center',
              padding: '0 2rem',
              userSelect: 'none',
            }}
          >
            {callout.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
