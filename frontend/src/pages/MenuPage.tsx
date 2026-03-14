import { useState } from 'react';
import { motion } from 'framer-motion';
import { colors } from '../design/theme';
import { textStyle, fontFamily } from '../design/typography';
import { duration, ease, stagger } from '../design/motion';
import { buttonStyle, buttonHoverStyle, inputStyle } from '../design/components';

interface MenuPageProps {
  onPlayAI: (playerName: string) => void;
  onPlayMultiplayer: (playerName: string) => void;
  onViewHistory: () => void;
}

export default function MenuPage({
  onPlayAI,
  onPlayMultiplayer,
  onViewHistory,
}: MenuPageProps) {
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem('battleship_player_name') || '';
    } catch {
      return '';
    }
  });

  const handleNameChange = (value: string) => {
    const trimmed = value.slice(0, 16);
    setPlayerName(trimmed);
    try {
      localStorage.setItem('battleship_player_name', trimmed);
    } catch {
    }
  };

  const resolvedName = playerName.trim() || 'Player';

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative"
      style={{ background: colors.bg.void }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration.reveal, ease: ease.default }}
        className="text-center mb-20"
      >
        <h1
          style={{
            ...textStyle.display,
            fontSize: '56px',
            color: colors.text.primary,
            letterSpacing: '0.3em',
          }}
        >
          BATTLESHIP
        </h1>
        <p
          className="mt-4"
          style={{
            ...textStyle.caption,
            color: colors.text.tertiary,
          }}
        >
          Naval Command
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration.slow, delay: 0.6, ease: ease.default }}
        className="mb-20"
      >
        <input
          type="text"
          value={playerName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="ENTER YOUR NAME"
          maxLength={16}
          className="px-6 py-3 text-center w-72 outline-none"
          style={{
            ...inputStyle,
            fontFamily: fontFamily.serif,
            fontSize: '14px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: colors.text.primary,
            caretColor: colors.accent.warmWhite,
          }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration.slow, delay: 0.8, ease: ease.default }}
        className="flex flex-col gap-4 w-72"
      >
        <MenuButton label="ENGAGE AI" onClick={() => onPlayAI(resolvedName)} delay={1.0} />
        <MenuButton label="MULTIPLAYER" onClick={() => onPlayMultiplayer(resolvedName)} delay={1.0 + stagger.normal} />
        <MenuButton label="BATTLE HISTORY" onClick={onViewHistory} delay={1.0 + stagger.normal * 2} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration.drift, delay: 2.0, ease: ease.default }}
        className="absolute bottom-6"
        style={{
          ...textStyle.caption,
          color: colors.text.ghost,
        }}
      >
        Strategic Naval Warfare Simulator
      </motion.p>
    </div>
  );
}

function MenuButton({
  label,
  onClick,
  delay,
}: {
  label: string;
  onClick: () => void;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: duration.slow, delay, ease: ease.default }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className="px-6 py-4 text-sm tracking-[0.3em] uppercase cursor-pointer"
      style={{
        ...buttonStyle,
        ...(hovered ? buttonHoverStyle : {}),
        fontFamily: fontFamily.serif,
        fontWeight: 300,
      }}
    >
      {label}
    </motion.button>
  );
}
