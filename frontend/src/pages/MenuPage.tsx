import { motion } from 'framer-motion';

interface MenuPageProps {
  onPlayAI: () => void;
  onPlayMultiplayer: () => void;
  onViewHistory: () => void;
}

export default function MenuPage({
  onPlayAI,
  onPlayMultiplayer,
  onViewHistory,
}: MenuPageProps) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative"
      style={{ background: 'radial-gradient(ellipse at center, #0f1a2e 0%, #0a0e1a 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h1
          className="text-7xl font-bold tracking-[0.3em] uppercase"
          style={{
            color: '#38bdf8',
            textShadow: '0 0 40px rgba(56, 189, 248, 0.5), 0 0 80px rgba(56, 189, 248, 0.2)',
          }}
        >
          BATTLESHIP
        </h1>
        <p
          className="text-sm tracking-[0.5em] uppercase mt-4"
          style={{ color: '#64748b' }}
        >
          Naval Command System
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-col gap-4 w-72"
      >
        <MenuButton label="ENGAGE AI" color="#22c55e" onClick={onPlayAI} delay={0.4} />
        <MenuButton label="MULTIPLAYER" color="#38bdf8" onClick={onPlayMultiplayer} delay={0.5} />
        <MenuButton label="BATTLE HISTORY" color="#94a3b8" onClick={onViewHistory} delay={0.6} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 text-xs tracking-widest uppercase"
        style={{ color: '#64748b' }}
      >
        Strategic Naval Warfare Simulator
      </motion.p>
    </div>
  );
}

function MenuButton({
  label,
  color,
  onClick,
  delay,
}: {
  label: string;
  color: string;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.03, x: 4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="px-6 py-4 text-sm font-bold tracking-[0.3em] uppercase cursor-pointer rounded"
      style={{
        background: 'rgba(10, 14, 26, 0.8)',
        border: `1px solid ${color}40`,
        color,
        textShadow: `0 0 10px ${color}40`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {label}
    </motion.button>
  );
}
