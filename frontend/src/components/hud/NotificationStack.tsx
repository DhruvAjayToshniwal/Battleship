import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  text: string;
  type: 'hit' | 'miss' | 'sunk' | 'info';
}

const TYPE_COLORS: Record<string, string> = {
  hit: '#ef4444',
  miss: '#38bdf8',
  sunk: '#fbbf24',
  info: '#94a3b8',
};

interface NotificationStackProps {
  message: string;
  lastResult: { result: string; coordinate: string; ship_sunk?: boolean } | null;
}

export default function NotificationStack({ message, lastResult }: NotificationStackProps) {
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
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="px-3 py-2 rounded text-xs font-bold tracking-widest uppercase"
            style={{
              background: 'rgba(10, 14, 26, 0.9)',
              border: `1px solid ${TYPE_COLORS[n.type]}40`,
              color: TYPE_COLORS[n.type],
              backdropFilter: 'blur(8px)',
              textShadow: `0 0 10px ${TYPE_COLORS[n.type]}60`,
            }}
          >
            {n.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
