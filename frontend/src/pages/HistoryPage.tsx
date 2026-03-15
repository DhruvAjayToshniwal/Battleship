import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as api from '../services/api';
import { colors } from '../design/theme';
import { textStyle, fontFamily } from '../design/typography';
import { duration, ease, stagger } from '../design/motion';
import { buttonStyle, buttonHoverStyle } from '../design/components';

interface HistoryPageProps {
  onBack: () => void;
}

export default function HistoryPage({ onBack }: HistoryPageProps) {
  const [games, setGames] = useState<api.GameHistorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBack, setHoveredBack] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const result = await api.getHistory(50);
        setGames(result.games);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div
      className="w-full h-full flex flex-col items-center relative overflow-hidden"
      style={{ background: colors.bg.void }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration.slow, ease: ease.default }}
        className="w-full max-w-2xl pt-8 sm:pt-12 px-3 sm:px-6"
      >
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <h2
            className="text-lg sm:text-2xl"
            style={{
              ...textStyle.title,
              color: colors.text.secondary,
            }}
          >
            BATTLE HISTORY
          </h2>
          <button
            onMouseEnter={() => setHoveredBack(true)}
            onMouseLeave={() => setHoveredBack(false)}
            onClick={onBack}
            className="px-4 py-2 text-xs tracking-[0.2em] uppercase cursor-pointer"
            style={{
              ...buttonStyle,
              ...(hoveredBack ? buttonHoverStyle : {}),
              fontFamily: fontFamily.serif,
              fontWeight: 300,
            }}
          >
            BACK
          </button>
        </div>

        {loading && (
          <p
            className="text-center"
            style={{
              ...textStyle.caption,
              color: colors.text.tertiary,
            }}
          >
            Loading...
          </p>
        )}

        {error && (
          <p
            className="text-center text-sm"
            style={{ color: colors.accent.red, fontFamily: fontFamily.serif }}
          >
            {error}
          </p>
        )}

        {!loading && !error && games.length === 0 && (
          <p
            className="text-center"
            style={{
              ...textStyle.caption,
              color: colors.text.tertiary,
            }}
          >
            No completed games yet
          </p>
        )}

        <div className="flex flex-col gap-4 sm:gap-6 overflow-y-auto pb-12" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {games.map((game, index) => (
            <motion.div
              key={game.room_id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: duration.slow, delay: index * stagger.fast, ease: ease.default }}
              className="px-3 sm:px-5 py-4 sm:py-5"
              style={{
                background: colors.bg.deep,
                border: `1px solid ${colors.border.hairline}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs tracking-widest uppercase px-2 py-1"
                    style={{
                      border: `1px solid ${colors.border.emphasis}`,
                      color: colors.text.secondary,
                      fontFamily: fontFamily.serif,
                    }}
                  >
                    {game.mode === 'ai' ? 'VS AI' : 'PVP'}
                  </span>
                  <span
                    style={{
                      ...textStyle.data,
                      color: colors.text.tertiary,
                    }}
                  >
                    {game.room_code}
                  </span>
                </div>
                <span
                  style={{
                    ...textStyle.data,
                    color: colors.text.ghost,
                  }}
                >
                  {game.created_at ? new Date(game.created_at).toLocaleDateString() : ''}
                </span>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-2 sm:gap-4">
                  <span
                    style={{
                      ...textStyle.data,
                      color: colors.text.secondary,
                    }}
                  >
                    {game.move_count} moves
                  </span>
                  {game.duration_seconds && (
                    <span
                      style={{
                        ...textStyle.data,
                        color: colors.text.ghost,
                      }}
                    >
                      {Math.floor(game.duration_seconds / 60)}m {game.duration_seconds % 60}s
                    </span>
                  )}
                </div>
                <span
                  className="text-xs tracking-widest uppercase"
                  style={{
                    fontFamily: fontFamily.mono,
                    color: game.winner_name ? colors.accent.silver : colors.accent.red,
                  }}
                >
                  {game.winner_name ? `Winner: ${game.winner_name}` : 'In Progress'}
                </span>
              </div>

              {game.players.length > 0 && (
                <div className="flex gap-4 mt-3">
                  {game.players.map((p) => (
                    <span
                      key={p.player_id}
                      style={{
                        ...textStyle.data,
                        color: colors.text.ghost,
                      }}
                    >
                      {p.display_name} ({p.player_slot})
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
