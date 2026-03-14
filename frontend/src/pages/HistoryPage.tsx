import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as api from '../services/api';

interface HistoryPageProps {
  onBack: () => void;
}

export default function HistoryPage({ onBack }: HistoryPageProps) {
  const [games, setGames] = useState<api.GameHistorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      style={{ background: 'radial-gradient(ellipse at center, #0f1a2e 0%, #0a0e1a 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl pt-12 px-6"
      >
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-2xl font-bold tracking-[0.2em] uppercase"
            style={{ color: '#38bdf8' }}
          >
            BATTLE HISTORY
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-4 py-2 text-xs font-bold tracking-[0.2em] uppercase cursor-pointer rounded"
            style={{
              background: 'transparent',
              border: '1px solid #64748b40',
              color: '#64748b',
            }}
          >
            BACK
          </motion.button>
        </div>

        {loading && (
          <p className="text-center text-sm tracking-widest uppercase" style={{ color: '#64748b' }}>
            Loading...
          </p>
        )}

        {error && (
          <p className="text-center text-sm" style={{ color: '#ef4444' }}>
            {error}
          </p>
        )}

        {!loading && !error && games.length === 0 && (
          <p className="text-center text-sm tracking-widest uppercase" style={{ color: '#64748b' }}>
            No completed games yet
          </p>
        )}

        <div className="flex flex-col gap-3 overflow-y-auto pb-12" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          {games.map((game, index) => (
            <motion.div
              key={game.room_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="px-5 py-4 rounded"
              style={{
                background: 'rgba(10, 14, 26, 0.9)',
                border: `1px solid ${game.winner_name ? '#22c55e20' : '#ef444420'}`,
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-bold tracking-widest uppercase px-2 py-1 rounded"
                    style={{
                      background: game.mode === 'ai' ? '#fbbf2420' : '#38bdf820',
                      color: game.mode === 'ai' ? '#fbbf24' : '#38bdf8',
                    }}
                  >
                    {game.mode === 'ai' ? 'VS AI' : 'PVP'}
                  </span>
                  <span className="text-xs font-mono" style={{ color: '#64748b' }}>
                    {game.room_code}
                  </span>
                </div>
                <span className="text-xs" style={{ color: '#475569' }}>
                  {game.created_at ? new Date(game.created_at).toLocaleDateString() : ''}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xs tracking-widest uppercase" style={{ color: '#94a3b8' }}>
                    {game.move_count} moves
                  </span>
                  {game.duration_seconds && (
                    <span className="text-xs" style={{ color: '#475569' }}>
                      {Math.floor(game.duration_seconds / 60)}m {game.duration_seconds % 60}s
                    </span>
                  )}
                </div>
                <span
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: game.winner_name ? '#22c55e' : '#ef4444' }}
                >
                  {game.winner_name ? `Winner: ${game.winner_name}` : 'In Progress'}
                </span>
              </div>

              {game.players.length > 0 && (
                <div className="flex gap-4 mt-2">
                  {game.players.map((p) => (
                    <span key={p.player_id} className="text-xs" style={{ color: '#475569' }}>
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
