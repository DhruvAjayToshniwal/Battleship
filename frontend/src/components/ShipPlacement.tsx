import { motion, AnimatePresence } from 'framer-motion';
import type { Orientation, PlacedShip } from '../hooks/useShipPlacement';
import type { Difficulty } from '../services/api';
import { colors } from '../design/theme';
import { textStyle } from '../design/typography';
import { transition } from '../design/motion';

interface ShipPlacementProps {
  shipsToPlace: readonly { readonly name: string; readonly size: number }[];
  currentShipIndex: number;
  placedShips: PlacedShip[];
  allShipsPlaced: boolean;
  orientation: Orientation;
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  onAutoPlace: () => void;
  onConfirm: () => void;
  onUndo: () => void;
  loading: boolean;
  hidesDifficulty?: boolean;
}

export default function ShipPlacement({
  shipsToPlace,
  currentShipIndex,
  placedShips,
  allShipsPlaced,
  orientation,
  difficulty,
  onChangeDifficulty,
  onAutoPlace,
  onConfirm,
  onUndo,
  loading,
  hidesDifficulty = false,
}: ShipPlacementProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition.fadeIn}
      className="fixed left-6 top-1/2 -translate-y-1/2 z-20"
    >
      <div
        style={{
          background: colors.bg.deep,
          border: `1px solid ${colors.border.hairline}`,
          padding: '32px 28px',
          minWidth: '260px',
        }}
      >
        <h2
          style={{
            ...textStyle.title,
            color: colors.text.secondary,
            marginBottom: '24px',
          }}
        >
          Deploy Fleet
        </h2>

        {!hidesDifficulty && (
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                ...textStyle.caption,
                color: colors.text.tertiary,
                marginBottom: '8px',
              }}
            >
              DIFFICULTY
            </div>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => onChangeDifficulty(d)}
                  className="flex-1 cursor-pointer"
                  style={{
                    ...textStyle.caption,
                    padding: '6px 0',
                    background: 'transparent',
                    border: `1px solid ${difficulty === d ? colors.border.emphasis : colors.border.hairline}`,
                    color: difficulty === d ? colors.accent.silver : colors.text.tertiary,
                    transition: 'color 0.6s ease, border-color 0.6s ease',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2" style={{ marginBottom: '28px' }}>
          {shipsToPlace.map((ship, i) => {
            const isPlaced = i < currentShipIndex;
            const isCurrent = i === currentShipIndex;
            return (
              <div
                key={ship.name}
                style={{
                  padding: '8px 10px',
                  background: isCurrent ? 'rgba(74,158,173,0.06)' : 'transparent',
                  borderLeft: isCurrent
                    ? `2px solid ${colors.accent.cyan}`
                    : isPlaced
                    ? `2px solid ${colors.border.subtle}`
                    : '2px solid transparent',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      ...textStyle.body,
                      color: isPlaced ? colors.text.secondary : isCurrent ? colors.text.primary : colors.text.tertiary,
                    }}
                  >
                    {ship.name}
                  </span>
                  <span
                    style={{
                      ...textStyle.caption,
                      color: colors.text.tertiary,
                    }}
                  >
                    {isPlaced ? 'DEPLOYED' : isCurrent ? 'PLACING' : `Size ${ship.size}`}
                  </span>
                </div>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: ship.size }, (__, j) => (
                    <div
                      key={j}
                      style={{
                        width: '16px',
                        height: '6px',
                        background: isPlaced
                          ? colors.border.emphasis
                          : isCurrent
                          ? colors.accent.cyan
                          : colors.border.hairline,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!allShipsPlaced && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ ...textStyle.caption, color: colors.text.tertiary }}>
              Click on grid to place ship
            </p>
            <p style={{ ...textStyle.caption, color: colors.text.tertiary, marginTop: '4px' }}>
              Press <span style={{ ...textStyle.data, color: colors.text.secondary }}>R</span> to rotate ({orientation === 'h' ? 'Horizontal' : 'Vertical'})
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {placedShips.length > 0 && !allShipsPlaced && (
            <button
              onClick={onUndo}
              className="w-full cursor-pointer"
              style={{
                ...textStyle.caption,
                padding: '8px 16px',
                background: 'transparent',
                border: `1px solid ${colors.border.subtle}`,
                color: colors.text.tertiary,
                transition: 'color 0.6s ease, border-color 0.6s ease',
              }}
            >
              UNDO LAST
            </button>
          )}

          <button
            onClick={onAutoPlace}
            className="w-full cursor-pointer"
            style={{
              ...textStyle.caption,
              padding: '8px 16px',
              background: 'transparent',
              border: `1px solid ${colors.border.subtle}`,
              color: colors.text.secondary,
              transition: 'color 0.6s ease, border-color 0.6s ease',
            }}
          >
            AUTO DEPLOY
          </button>

          <AnimatePresence>
            {allShipsPlaced && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition.fadeIn}
                onClick={onConfirm}
                disabled={loading}
                className="w-full cursor-pointer"
                style={{
                  ...textStyle.caption,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: `1px solid ${colors.border.emphasis}`,
                  color: colors.accent.silver,
                  transition: 'color 0.6s ease, border-color 0.6s ease',
                }}
              >
                {loading ? 'DEPLOYING...' : 'START BATTLE'}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
