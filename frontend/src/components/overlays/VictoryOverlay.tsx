import { motion, AnimatePresence } from 'framer-motion';
import type { Difficulty, GameStateResponse } from '../../services/api';
import { colors, overlay } from '../../design/theme';
import { textStyle, fontFamily } from '../../design/typography';
import { transition, ease, stagger } from '../../design/motion';

interface VictoryOverlayProps {
  visible: boolean;
  difficulty: Difficulty;
  onRestart: (difficulty?: Difficulty) => void;
  onChangeDifficulty: (d: Difficulty) => void;
  loading: boolean;
  gameState: GameStateResponse | null;
  isMultiplayer?: boolean;
  onBackToMenu?: () => void;
}

const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

function computeStats(gameState: GameStateResponse | null) {
  if (!gameState) return null;
  const shots = gameState.player_shots ?? [];
  const shotsFired = shots.length;
  const hits = shots.filter(
    (s) => s.result === 'hit' || s.result === 'sunk'
  ).length;
  const accuracy = shotsFired > 0 ? Math.round((hits / shotsFired) * 100) : 0;
  const enemyShipsSunk = 5 - (gameState.ai_ships_remaining ?? 5);
  const playerShipsRemaining = gameState.player_ships_remaining ?? 0;
  return { shotsFired, hits, accuracy, enemyShipsSunk, playerShipsRemaining };
}

export default function VictoryOverlay({ visible, difficulty, onRestart, onChangeDifficulty, loading, gameState, isMultiplayer = false, onBackToMenu }: VictoryOverlayProps) {
  const stats = computeStats(gameState);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition.fadeIn}
          className="fixed inset-0 z-30 flex flex-col items-center justify-center"
          style={{ background: overlay.backdrop }}
        >
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: ease.default }}
            style={{
              ...textStyle.display,
              color: colors.text.primary,
              marginBottom: 16,
            }}
          >
            VICTORY
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: stagger.normal, duration: 1.2, ease: ease.default }}
            style={{
              ...textStyle.body,
              color: colors.text.secondary,
              marginBottom: 24,
            }}
          >
            All enemy vessels have been destroyed.
          </motion.p>

          {stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: stagger.normal * 2, duration: 1.2, ease: ease.default }}
              className="grid grid-cols-3 gap-2 sm:gap-4 mb-8 px-4 sm:px-6 py-4"
              style={{
                background: colors.bg.deep,
                border: `1px solid ${colors.border.hairline}`,
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <span style={{ ...textStyle.caption, color: colors.text.tertiary }}>Shots Fired</span>
                <span style={{ fontFamily: fontFamily.mono, fontSize: '18px', color: colors.text.primary }}>{stats.shotsFired}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span style={{ ...textStyle.caption, color: colors.text.tertiary }}>Hits</span>
                <span style={{ fontFamily: fontFamily.mono, fontSize: '18px', color: colors.text.primary }}>{stats.hits}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span style={{ ...textStyle.caption, color: colors.text.tertiary }}>Accuracy</span>
                <span style={{ fontFamily: fontFamily.mono, fontSize: '18px', color: colors.text.primary }}>{stats.accuracy}%</span>
              </div>
              <div className="flex flex-col items-center gap-1 col-span-1">
                <span style={{ ...textStyle.caption, color: colors.text.tertiary }}>Enemy Sunk</span>
                <span style={{ fontFamily: fontFamily.mono, fontSize: '18px', color: colors.text.primary }}>{stats.enemyShipsSunk}</span>
              </div>
              <div className="flex flex-col items-center gap-1 col-span-1 col-start-3">
                <span style={{ ...textStyle.caption, color: colors.text.tertiary }}>Ships Left</span>
                <span style={{ fontFamily: fontFamily.mono, fontSize: '18px', color: colors.text.primary }}>{stats.playerShipsRemaining}</span>
              </div>
            </motion.div>
          )}

          {!isMultiplayer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: stagger.normal * 3, duration: 1.2, ease: ease.default }}
              className="flex gap-3 mb-6"
            >
              {difficulties.map((d) => (
                <button
                  key={d}
                  onClick={() => onChangeDifficulty(d)}
                  className="px-4 py-2 text-xs tracking-widest uppercase cursor-pointer"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${d === difficulty ? colors.border.emphasis : colors.border.subtle}`,
                    color: d === difficulty ? colors.accent.silver : colors.text.tertiary,
                    fontFamily: fontFamily.mono,
                    transition: 'color 0.8s, border-color 0.8s',
                  }}
                >
                  {d}
                </button>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: stagger.normal * 4, duration: 1.2, ease: ease.default }}
            className="flex gap-3"
          >
            {isMultiplayer && onBackToMenu ? (
              <button
                onClick={onBackToMenu}
                className="px-6 sm:px-8 py-3 text-xs sm:text-sm tracking-widest uppercase cursor-pointer"
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border.subtle}`,
                  color: colors.text.secondary,
                  fontFamily: fontFamily.mono,
                  transition: 'color 0.8s, border-color 0.8s',
                }}
              >
                BACK TO MENU
              </button>
            ) : (
              <button
                onClick={() => onRestart(difficulty)}
                disabled={loading}
                className="px-6 sm:px-8 py-3 text-xs sm:text-sm tracking-widest uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border.subtle}`,
                  color: colors.text.secondary,
                  fontFamily: fontFamily.mono,
                  transition: 'color 0.8s, border-color 0.8s',
                }}
              >
                {loading ? 'DEPLOYING...' : 'NEW BATTLE'}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
