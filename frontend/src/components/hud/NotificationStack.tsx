import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../design/theme';
import { fontFamily } from '../../design/typography';
import { ease } from '../../design/motion';

interface Notification {
  id: string;
  text: string;
  type: 'hit' | 'miss' | 'sunk' | 'info';
}

interface NotificationStackProps {
  message: string;
  lastResult: { result: string; coordinate: string; ship_sunk?: boolean } | null;
}

const typeStyles: Record<Notification['type'], { color: string; border: string; bg: string; label: string }> = {
  hit: {
    color: '#ff4444',
    border: '#ff4444',
    bg: 'rgba(255, 40, 40, 0.12)',
    label: 'HIT',
  },
  sunk: {
    color: '#ff6622',
    border: '#ff6622',
    bg: 'rgba(255, 100, 30, 0.15)',
    label: 'SUNK',
  },
  miss: {
    color: '#5ab4e8',
    border: '#5ab4e8',
    bg: 'rgba(80, 180, 240, 0.10)',
    label: 'MISS',
  },
  info: {
    color: colors.text.secondary,
    border: colors.border.hairline,
    bg: 'rgba(10,10,10,0.8)',
    label: '',
  },
};

export default function NotificationStack({ lastResult }: NotificationStackProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const lastResultRef = useRef<string | null>(null);

  const addNotification = useCallback((text: string, type: Notification['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev.slice(-4), { id, text, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    if (!lastResult) return;
    const key = `${lastResult.coordinate}-${lastResult.result}`;
    if (key === lastResultRef.current) return;
    lastResultRef.current = key;

    if (lastResult.ship_sunk) {
      addNotification(lastResult.coordinate, 'sunk');
    } else if (lastResult.result === 'hit') {
      addNotification(lastResult.coordinate, 'hit');
    } else {
      addNotification(lastResult.coordinate, 'miss');
    }
  }, [lastResult, addNotification]);

  return (
    <div className="fixed top-36 sm:top-48 right-2 sm:right-4 z-20 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => {
          const style = typeStyles[n.type];
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 60, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4, ease: ease.default }}
              style={{
                padding: '10px 16px',
                background: style.bg,
                border: `1px solid ${style.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: '13px',
                  fontWeight: 700,
                  color: style.color,
                  letterSpacing: '0.15em',
                }}
              >
                {style.label}
              </span>
              <span
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#e8e8e8',
                  letterSpacing: '0.08em',
                }}
              >
                {n.text}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
