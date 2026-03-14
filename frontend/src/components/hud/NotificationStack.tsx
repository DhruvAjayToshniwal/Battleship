import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../design/theme';
import { textStyle, fontFamily } from '../../design/typography';
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

export default function NotificationStack({ lastResult }: NotificationStackProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const lastResultRef = useRef<string | null>(null);

  const addNotification = useCallback((text: string, type: Notification['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev.slice(-4), { id, text, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    if (!lastResult) return;
    const key = `${lastResult.coordinate}-${lastResult.result}`;
    if (key === lastResultRef.current) return;
    lastResultRef.current = key;

    if (lastResult.ship_sunk) {
      addNotification(`SHIP SUNK at ${lastResult.coordinate}!`, 'sunk');
    } else if (lastResult.result === 'hit') {
      addNotification(`HIT at ${lastResult.coordinate}`, 'hit');
    } else {
      addNotification(`MISS at ${lastResult.coordinate}`, 'miss');
    }
  }, [lastResult, addNotification]);

  return (
    <div className="fixed top-48 right-4 z-20 flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 200 }}>
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.6, ease: ease.default }}
            style={{
              padding: '8px 12px',
              background: 'rgba(10,10,10,0.8)',
              border: `1px solid ${colors.border.hairline}`,
              color: colors.text.secondary,
              ...textStyle.caption,
            }}
          >
            <span style={{ fontFamily: fontFamily.mono }}>
              {n.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
