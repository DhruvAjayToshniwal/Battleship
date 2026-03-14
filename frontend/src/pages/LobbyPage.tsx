import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as api from '../services/api';
import { saveSession } from '../services/session';
import { useRealtimeRoom } from '../hooks/useRealtimeRoom';

interface LobbyPageProps {
  onGameReady: (params: {
    roomId: string;
    playerToken: string;
    playerId: string;
    playerSlot: string;
    mode: 'human';
  }) => void;
  onBack: () => void;
}

type LobbyState = 'choose' | 'creating' | 'waiting' | 'joining';

export default function LobbyPage({ onGameReady, onBack }: LobbyPageProps) {
  const [lobbyState, setLobbyState] = useState<LobbyState>('choose');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [playerToken, setPlayerToken] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [playerSlot, setPlayerSlot] = useState('');
  const [opponentName, setOpponentName] = useState<string | null>(null);

  useRealtimeRoom({
    roomId,
    playerToken,
    playerId,
    enabled: lobbyState === 'waiting',
    onOpponentJoined: () => {
      setOpponentName('Opponent');
      setTimeout(() => {
        onGameReady({
          roomId,
          playerToken,
          playerId,
          playerSlot,
          mode: 'human',
        });
      }, 1000);
    },
  });

  const handleCreateRoom = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.createRoom('human', 'Player');
      setRoomCode(result.room_code);
      setRoomId(result.room_id);
      setPlayerToken(result.client_token);
      setPlayerId(result.player_id);
      setPlayerSlot('player1');

      saveSession({
        roomId: result.room_id,
        playerToken: result.client_token,
        mode: 'human',
        playerSlot: 'player1',
        playerId: result.player_id,
      });

      setLobbyState('waiting');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create room';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleJoinRoom = useCallback(async () => {
    try {
      if (joinCode.length < 4) {
        setError('Enter a valid room code');
        return;
      }
      setLoading(true);
      setError(null);
      const result = await api.joinRoom(joinCode.toUpperCase());

      saveSession({
        roomId: result.room_id,
        playerToken: result.client_token,
        mode: 'human',
        playerSlot: result.player_slot,
        playerId: result.player_id,
      });

      onGameReady({
        roomId: result.room_id,
        playerToken: result.client_token,
        playerId: result.player_id,
        playerSlot: result.player_slot,
        mode: 'human',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join room';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [joinCode, onGameReady]);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative"
      style={{ background: 'radial-gradient(ellipse at center, #0f1a2e 0%, #0a0e1a 100%)' }}
    >
      {lobbyState === 'choose' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6"
        >
          <h2
            className="text-3xl font-bold tracking-[0.2em] uppercase mb-8"
            style={{ color: '#38bdf8' }}
          >
            MULTIPLAYER
          </h2>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateRoom}
            disabled={loading}
            className="px-8 py-4 text-sm font-bold tracking-[0.3em] uppercase cursor-pointer rounded w-64"
            style={{
              background: 'rgba(10, 14, 26, 0.8)',
              border: '1px solid #38bdf840',
              color: '#38bdf8',
            }}
          >
            CREATE ROOM
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setLobbyState('joining')}
            className="px-8 py-4 text-sm font-bold tracking-[0.3em] uppercase cursor-pointer rounded w-64"
            style={{
              background: 'rgba(10, 14, 26, 0.8)',
              border: '1px solid #22c55e40',
              color: '#22c55e',
            }}
          >
            JOIN ROOM
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onBack}
            className="px-8 py-3 text-xs font-bold tracking-[0.3em] uppercase cursor-pointer rounded w-64 mt-4"
            style={{
              background: 'transparent',
              border: '1px solid #64748b40',
              color: '#64748b',
            }}
          >
            BACK
          </motion.button>
        </motion.div>
      )}

      {lobbyState === 'waiting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <h2
            className="text-2xl font-bold tracking-[0.2em] uppercase"
            style={{ color: '#38bdf8' }}
          >
            WAITING FOR OPPONENT
          </h2>

          <div
            className="px-8 py-6 rounded text-center"
            style={{
              background: 'rgba(10, 14, 26, 0.9)',
              border: '1px solid #38bdf840',
            }}
          >
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: '#64748b' }}>
              ROOM CODE
            </p>
            <p
              className="text-5xl font-bold tracking-[0.5em] font-mono"
              style={{
                color: '#fbbf24',
                textShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
              }}
            >
              {roomCode}
            </p>
            <p className="text-xs tracking-widest uppercase mt-4" style={{ color: '#64748b' }}>
              Share this code with your opponent
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
            <span className="text-xs tracking-widest uppercase" style={{ color: '#94a3b8' }}>
              Player 1 (You) — Ready
            </span>
          </div>

          <div className="flex items-center gap-3">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-3 h-3 rounded-full"
              style={{ background: '#64748b' }}
            />
            <span className="text-xs tracking-widest uppercase" style={{ color: '#64748b' }}>
              {opponentName ? `${opponentName} — Joined!` : 'Player 2 — Waiting...'}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onBack}
            className="px-6 py-2 text-xs font-bold tracking-[0.3em] uppercase cursor-pointer rounded mt-6"
            style={{
              background: 'transparent',
              border: '1px solid #64748b40',
              color: '#64748b',
            }}
          >
            CANCEL
          </motion.button>
        </motion.div>
      )}

      {lobbyState === 'joining' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6"
        >
          <h2
            className="text-2xl font-bold tracking-[0.2em] uppercase"
            style={{ color: '#22c55e' }}
          >
            JOIN ROOM
          </h2>

          <div className="flex flex-col items-center gap-4">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              placeholder="ENTER CODE"
              maxLength={6}
              className="px-6 py-4 text-3xl font-mono font-bold text-center tracking-[0.5em] uppercase rounded w-72 outline-none"
              style={{
                background: 'rgba(10, 14, 26, 0.9)',
                border: '1px solid #22c55e40',
                color: '#fbbf24',
                caretColor: '#fbbf24',
              }}
            />

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleJoinRoom}
              disabled={loading || joinCode.length < 4}
              className="px-8 py-3 text-sm font-bold tracking-[0.3em] uppercase cursor-pointer rounded w-72"
              style={{
                background: loading ? 'rgba(10, 14, 26, 0.5)' : 'rgba(10, 14, 26, 0.8)',
                border: '1px solid #22c55e40',
                color: loading ? '#64748b' : '#22c55e',
              }}
            >
              {loading ? 'JOINING...' : 'JOIN'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setLobbyState('choose');
                setError(null);
              }}
              className="px-6 py-2 text-xs font-bold tracking-[0.3em] uppercase cursor-pointer rounded mt-2"
              style={{
                background: 'transparent',
                border: '1px solid #64748b40',
                color: '#64748b',
              }}
            >
              BACK
            </motion.button>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-8 px-6 py-3 rounded text-xs font-bold tracking-widest uppercase"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef444440',
            color: '#ef4444',
          }}
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
