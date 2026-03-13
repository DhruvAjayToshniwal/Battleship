import type { Phase } from '../../hooks/useBattleSequence';
import type { Difficulty, GameStateResponse } from '../../services/api';
import TopStatusBar from './TopStatusBar';
import FleetPanel from './FleetPanel';
import DifficultyBadge from './DifficultyBadge';

interface CommandHUDProps {
  phase: Phase;
  gameState: GameStateResponse | null;
  isPlayerTurn: boolean;
  message: string;
  difficulty: Difficulty;
  onRestart: (difficulty?: Difficulty) => void;
  onChangeDifficulty: (d: Difficulty) => void;
  loading: boolean;
}

export default function CommandHUD({
  phase,
  gameState,
  isPlayerTurn,
  message,
  difficulty,
  onRestart,
}: CommandHUDProps) {
  return (
    <>
      <TopStatusBar message={message} phase={phase} isPlayerTurn={isPlayerTurn} />

      <DifficultyBadge difficulty={difficulty} />

      {gameState && (
        <>
          <FleetPanel
            title="Your Fleet"
            shipsRemaining={gameState.player_ships_remaining}
            shotsCount={gameState.ai_shots.length}
            accentColor="#22d3ee"
            side="left"
          />
          <FleetPanel
            title="Enemy Fleet"
            shipsRemaining={gameState.ai_ships_remaining}
            shotsCount={gameState.player_shots.length}
            accentColor="#ef4444"
            side="right"
          />
        </>
      )}

      {phase !== 'setup' && (
        <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center gap-48 pointer-events-none">
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'rgba(34, 211, 238, 0.5)' }}
          >
            YOUR WATERS
          </span>
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'rgba(239, 68, 68, 0.5)' }}
          >
            ENEMY WATERS
          </span>
        </div>
      )}

      {phase === 'playing' && (
        <button
          onClick={() => onRestart()}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded text-xs font-bold tracking-widest uppercase cursor-pointer transition-all hover:scale-105"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            backdropFilter: 'blur(8px)',
          }}
        >
          RETREAT
        </button>
      )}
    </>
  );
}
