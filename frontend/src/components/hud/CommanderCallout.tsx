import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribe } from '../../hooks/useVoiceCommander';
import type { VoiceEvent } from '../../hooks/useVoiceCommander';
import { colors } from '../../design/theme';
import { fontFamily } from '../../design/typography';
import { ease } from '../../design/motion';

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

  return (
    <div className="fixed top-0 left-0 right-0 flex items-start justify-center pointer-events-none z-40" style={{ paddingTop: '30vh' }}>
      <AnimatePresence mode="wait">
        {callout && (
          <motion.div
            key={callout.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.6,
              ease: ease.default,
            }}
            style={{
              color: colors.text.secondary,
              fontFamily: fontFamily.serif,
              fontWeight: 300,
              fontSize: 'clamp(1.2rem, 3vw, 2rem)',
              letterSpacing: '0.15em',
              textAlign: 'center',
              padding: '0 2rem',
              userSelect: 'none',
              textTransform: 'uppercase',
            }}
          >
            {callout.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
