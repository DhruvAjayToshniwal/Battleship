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
  mode?: 'ai' | 'human';
  playerName?: string;
  onBackToMenu?: () => void;
}

export default function CommandHUD({
  phase,
  gameState,
  isPlayerTurn,
  message,
  difficulty,
  onRestart,
  mode = 'ai',
  playerName = 'Player',
  onBackToMenu,
}: CommandHUDProps) {
  return (
    <>
      <TopStatusBar message={message} phase={phase} isPlayerTurn={isPlayerTurn} />

      <DifficultyBadge difficulty={difficulty} />

      {gameState && (
        <>
          <FleetPanel
            title={`${playerName}'s Fleet`}
            shipsRemaining={gameState.player_ships_remaining}
            shotsCount={gameState.ai_shots.length}
            accentColor="#22d3ee"
            side="left"
          />
          <FleetPanel
            title={mode === 'ai' ? 'Enemy Fleet' : 'Opponent Fleet'}
            shipsRemaining={gameState.ai_ships_remaining}
            shotsCount={gameState.player_shots.length}
            accentColor="#ef4444"
            side="right"
          />
        </>
      )}

      {phase !== 'setup' && (
        <div className="fixed bottom-3 left-0 right-0 z-20 flex justify-center pointer-events-none" style={{ gap: '14rem' }}>
          <span
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: 'rgba(34, 211, 238, 0.4)' }}
          >
            {playerName.toUpperCase()}'S WATERS
          </span>
          <span
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: 'rgba(239, 68, 68, 0.4)' }}
          >
            ENEMY WATERS
          </span>
        </div>
      )}

      {phase === 'playing' && (
        <button
          onClick={() => mode === 'human' && onBackToMenu ? onBackToMenu() : onRestart()}
          className="fixed bottom-3 left-4 z-20 px-3 py-1.5 rounded text-[10px] font-bold tracking-widest uppercase cursor-pointer transition-all hover:scale-105"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            backdropFilter: 'blur(8px)',
          }}
        >
          {mode === 'human' ? 'ABANDON' : 'RETREAT'}
        </button>
      )}
    </>
  );
}
