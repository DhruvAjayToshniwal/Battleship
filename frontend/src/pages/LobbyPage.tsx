import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as api from '../services/api';
import { saveSession } from '../services/session';
import { useRealtimeRoom } from '../hooks/useRealtimeRoom';
import LobbyOverlay from '../components/overlays/LobbyOverlay';
import { colors } from '../design/theme';
import { textStyle, fontFamily } from '../design/typography';
import { duration, ease } from '../design/motion';
import { buttonStyle, buttonHoverStyle, inputStyle } from '../design/components';

interface LobbyPageProps {
  playerName: string;
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

export default function LobbyPage({ playerName, onGameReady, onBack }: LobbyPageProps) {
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
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

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
      const result = await api.createRoom('human', playerName);
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
      const result = await api.joinRoom(joinCode.toUpperCase(), playerName);

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
      style={{ background: colors.bg.void }}
    >
      {lobbyState === 'choose' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: duration.slow, ease: ease.default }}
          className="flex flex-col items-center gap-6"
        >
          <h2
            className="mb-8"
            style={{
              ...textStyle.title,
              fontSize: '28px',
              color: colors.text.secondary,
            }}
          >
            MULTIPLAYER
          </h2>

          <button
            onMouseEnter={() => setHoveredBtn('create')}
            onMouseLeave={() => setHoveredBtn(null)}
            onClick={handleCreateRoom}
            disabled={loading}
            className="px-8 py-4 text-sm tracking-[0.3em] uppercase cursor-pointer w-64"
            style={{
              ...buttonStyle,
              ...(hoveredBtn === 'create' ? buttonHoverStyle : {}),
              fontFamily: fontFamily.serif,
              fontWeight: 300,
            }}
          >
            CREATE ROOM
          </button>

          <button
            onMouseEnter={() => setHoveredBtn('join')}
            onMouseLeave={() => setHoveredBtn(null)}
            onClick={() => setLobbyState('joining')}
            className="px-8 py-4 text-sm tracking-[0.3em] uppercase cursor-pointer w-64"
            style={{
              ...buttonStyle,
              ...(hoveredBtn === 'join' ? buttonHoverStyle : {}),
              fontFamily: fontFamily.serif,
              fontWeight: 300,
            }}
          >
            JOIN ROOM
          </button>

          <button
            onMouseEnter={() => setHoveredBtn('back')}
            onMouseLeave={() => setHoveredBtn(null)}
            onClick={onBack}
            className="px-8 py-3 text-xs tracking-[0.3em] uppercase cursor-pointer w-64 mt-4"
            style={{
              ...buttonStyle,
              ...(hoveredBtn === 'back' ? buttonHoverStyle : {}),
              fontFamily: fontFamily.serif,
              fontWeight: 300,
            }}
          >
            BACK
          </button>
        </motion.div>
      )}

      <LobbyOverlay
        visible={lobbyState === 'waiting'}
        roomCode={roomCode}
        opponentConnected={!!opponentName}
        onCancel={onBack}
      />

      {lobbyState === 'joining' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: duration.slow, ease: ease.default }}
          className="flex flex-col items-center gap-6"
        >
          <h2
            style={{
              ...textStyle.title,
              fontSize: '24px',
              color: colors.text.secondary,
            }}
          >
            JOIN ROOM
          </h2>

          <div className="flex flex-col items-center gap-4">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              placeholder="ROOM CODE"
              maxLength={6}
              className="px-6 py-4 text-3xl text-center w-72 outline-none"
              style={{
                ...inputStyle,
                fontFamily: fontFamily.mono,
                fontWeight: 400,
                letterSpacing: '0.5em',
                textTransform: 'uppercase',
                color: colors.accent.warmWhite,
                caretColor: colors.accent.warmWhite,
              }}
            />

            <button
              onMouseEnter={() => setHoveredBtn('joinSubmit')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={handleJoinRoom}
              disabled={loading || joinCode.length < 4}
              className="px-8 py-3 text-sm tracking-[0.3em] uppercase cursor-pointer w-72"
              style={{
                ...buttonStyle,
                ...(hoveredBtn === 'joinSubmit' ? buttonHoverStyle : {}),
                fontFamily: fontFamily.serif,
                fontWeight: 300,
                opacity: loading ? 0.4 : 1,
              }}
            >
              {loading ? 'JOINING...' : 'JOIN'}
            </button>

            <button
              onMouseEnter={() => setHoveredBtn('joinBack')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => {
                setLobbyState('choose');
                setError(null);
              }}
              className="px-6 py-2 text-xs tracking-[0.3em] uppercase cursor-pointer mt-2"
              style={{
                ...buttonStyle,
                ...(hoveredBtn === 'joinBack' ? buttonHoverStyle : {}),
                fontFamily: fontFamily.serif,
                fontWeight: 300,
              }}
            >
              BACK
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: duration.slow, ease: ease.default }}
          className="absolute bottom-8 px-6 py-3 text-xs tracking-widest uppercase"
          style={{
            color: colors.accent.red,
            fontFamily: fontFamily.serif,
          }}
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
