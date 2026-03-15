import type { Phase } from '../../hooks/useBattleSequence';
import type { Difficulty, GameStateResponse } from '../../services/api';
import { colors } from '../../design/theme';
import { textStyle } from '../../design/typography';
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
            accentColor={colors.player}
            side="left"
          />
          <FleetPanel
            title={mode === 'ai' ? 'Enemy Fleet' : 'Opponent Fleet'}
            shipsRemaining={gameState.ai_ships_remaining}
            shotsCount={gameState.player_shots.length}
            accentColor={colors.enemy}
            side="right"
          />
        </>
      )}

      {phase !== 'setup' && (
        <div className="fixed bottom-3 left-0 right-0 z-20 flex justify-center pointer-events-none gap-8 sm:gap-56 px-4">
          <span
            className="text-[9px] sm:text-[11px]"
            style={{
              ...textStyle.caption,
              color: colors.text.tertiary,
            }}
          >
            {playerName.toUpperCase()}'S WATERS
          </span>
          <span
            className="text-[9px] sm:text-[11px]"
            style={{
              ...textStyle.caption,
              color: colors.text.tertiary,
            }}
          >
            ENEMY WATERS
          </span>
        </div>
      )}

      {phase === 'playing' && (
        <button
          onClick={() => mode === 'human' && onBackToMenu ? onBackToMenu() : onRestart()}
          className="fixed bottom-3 left-2 sm:left-4 z-20 cursor-pointer"
          style={{
            ...textStyle.caption,
            padding: '8px 12px',
            background: 'transparent',
            border: `1px solid ${colors.border.subtle}`,
            color: colors.text.tertiary,
            transition: 'color 0.6s cubic-bezier(0.25,0.1,0.25,1)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = colors.text.secondary; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = colors.text.tertiary; }}
        >
          {mode === 'human' ? 'ABANDON' : 'RETREAT'}
        </button>
      )}
    </>
  );
}
