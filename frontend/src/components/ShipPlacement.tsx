import { motion, AnimatePresence } from 'framer-motion';
import type { Orientation, PlacedShip } from '../hooks/useGame';

interface ShipPlacementProps {
  shipsToPlace: { name: string; size: number }[];
  currentShipIndex: number;
  placedShips: PlacedShip[];
  allShipsPlaced: boolean;
  orientation: Orientation;
  onAutoPlace: () => void;
  onConfirm: () => void;
  onUndo: () => void;
  loading: boolean;
}

export default function ShipPlacement({
  shipsToPlace,
  currentShipIndex,
  placedShips,
  allShipsPlaced,
  orientation,
  onAutoPlace,
  onConfirm,
  onUndo,
  loading,
}: ShipPlacementProps) {
  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed left-6 top-1/2 -translate-y-1/2 z-20"
    >
      <div
        className="p-6 rounded-lg border"
        style={{
          background: 'rgba(10, 14, 26, 0.9)',
          borderColor: 'rgba(56, 189, 248, 0.3)',
          backdropFilter: 'blur(10px)',
          minWidth: '280px',
        }}
      >
        <h2
          className="text-lg font-bold mb-4 tracking-widest uppercase"
          style={{ color: '#38bdf8' }}
        >
          Deploy Fleet
        </h2>

        {/* Ship list */}
        <div className="space-y-2 mb-6">
          {shipsToPlace.map((ship, i) => {
            const isPlaced = i < currentShipIndex;
            const isCurrent = i === currentShipIndex;
            return (
              <motion.div
                key={ship.name}
                className="flex items-center justify-between p-2 rounded"
                style={{
                  background: isCurrent
                    ? 'rgba(56, 189, 248, 0.15)'
                    : isPlaced
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'rgba(255,255,255,0.03)',
                  borderLeft: isCurrent
                    ? '3px solid #38bdf8'
                    : isPlaced
                    ? '3px solid #22c55e'
                    : '3px solid transparent',
                }}
                animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div>
                  <span
                    className="text-sm font-bold"
                    style={{
                      color: isPlaced ? '#22c55e' : isCurrent ? '#38bdf8' : '#64748b',
                    }}
                  >
                    {ship.name}
                  </span>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: ship.size }, (_, j) => (
                      <div
                        key={j}
                        className="w-4 h-2 rounded-sm"
                        style={{
                          background: isPlaced
                            ? '#22c55e'
                            : isCurrent
                            ? '#38bdf8'
                            : '#334155',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs" style={{ color: '#64748b' }}>
                  {isPlaced ? 'DEPLOYED' : isCurrent ? 'PLACING' : `Size ${ship.size}`}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Instructions */}
        {!allShipsPlaced && (
          <div className="mb-4 text-xs space-y-1" style={{ color: '#64748b' }}>
            <p>Click on grid to place ship</p>
            <p>
              Press <kbd className="px-1 rounded" style={{ background: '#1e293b', color: '#38bdf8' }}>R</kbd> to rotate
              <span className="ml-2">
                ({orientation === 'h' ? 'Horizontal' : 'Vertical'})
              </span>
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-2">
          {placedShips.length > 0 && !allShipsPlaced && (
            <button
              onClick={onUndo}
              className="w-full py-2 px-4 rounded text-sm tracking-wider transition-colors cursor-pointer"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
              }}
            >
              UNDO LAST
            </button>
          )}

          <button
            onClick={onAutoPlace}
            className="w-full py-2 px-4 rounded text-sm tracking-wider transition-colors cursor-pointer"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
            }}
          >
            AUTO DEPLOY
          </button>

          <AnimatePresence>
            {allShipsPlaced && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={onConfirm}
                disabled={loading}
                className="w-full py-3 px-4 rounded text-sm font-bold tracking-widest cursor-pointer"
                style={{
                  background: 'rgba(34, 197, 94, 0.3)',
                  border: '2px solid #22c55e',
                  color: '#22c55e',
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
