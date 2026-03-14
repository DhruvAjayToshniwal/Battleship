import { useState, useCallback } from 'react';
import './styles/globals.css';
import { useSessionRestore } from './hooks/useSessionRestore';
import MenuPage from './pages/MenuPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import HistoryPage from './pages/HistoryPage';
import { clearSession } from './services/session';
import ReconnectOverlay from './components/overlays/ReconnectOverlay';

type Page = 'menu' | 'lobby' | 'game' | 'history';

interface GameParams {
  mode: 'ai' | 'human';
  roomId: string | null;
  playerToken: string | null;
  playerId: string | null;
  playerSlot: string | null;
}

function App() {
  const [page, setPage] = useState<Page>('menu');
  const [gameParams, setGameParams] = useState<GameParams>({
    mode: 'ai',
    roomId: null,
    playerToken: null,
    playerId: null,
    playerSlot: null,
  });
  const [playerName, setPlayerName] = useState('Player');

  const sessionRestore = useSessionRestore();

  const navigateToMenu = useCallback(() => {
    clearSession();
    setPage('menu');
    setGameParams({
      mode: 'ai',
      roomId: null,
      playerToken: null,
      playerId: null,
      playerSlot: null,
    });
  }, []);

  const handlePlayAI = useCallback((name: string) => {
    setPlayerName(name);
    setGameParams({
      mode: 'ai',
      roomId: null,
      playerToken: null,
      playerId: null,
      playerSlot: null,
    });
    setPage('game');
  }, []);

  const handlePlayMultiplayer = useCallback((name: string) => {
    setPlayerName(name);
    setPage('lobby');
  }, []);

  const handleViewHistory = useCallback(() => {
    setPage('history');
  }, []);

  const handleGameReady = useCallback((params: {
    roomId: string;
    playerToken: string;
    playerId: string;
    playerSlot: string;
    mode: 'human';
  }) => {
    setGameParams({
      mode: 'human',
      roomId: params.roomId,
      playerToken: params.playerToken,
      playerId: params.playerId,
      playerSlot: params.playerSlot,
    });
    setPage('game');
  }, []);

  if (sessionRestore.loading) {
    return (
      <div
        className="w-full h-full"
        style={{ background: '#0a0e1a' }}
      >
        <ReconnectOverlay visible={true} />
      </div>
    );
  }

  if (sessionRestore.reconnectData && page === 'menu') {
    const reconnect = sessionRestore.reconnectData;

    if (reconnect.room_status !== 'finished' && reconnect.room_status !== 'abandoned') {
      return (
        <GamePage
          mode={reconnect.mode as 'ai' | 'human'}
          roomId={reconnect.room_id}
          playerToken={reconnect.client_token}
          playerId={reconnect.player_id}
          playerSlot={reconnect.player_slot}
          playerName={playerName}
          onBackToMenu={navigateToMenu}
        />
      );
    }
  }

  if (page === 'menu') {
    return (
      <MenuPage
        onPlayAI={handlePlayAI}
        onPlayMultiplayer={handlePlayMultiplayer}
        onViewHistory={handleViewHistory}
      />
    );
  }

  if (page === 'lobby') {
    return (
      <LobbyPage
        playerName={playerName}
        onGameReady={handleGameReady}
        onBack={navigateToMenu}
      />
    );
  }

  if (page === 'game') {
    return (
      <GamePage
        mode={gameParams.mode}
        roomId={gameParams.roomId}
        playerToken={gameParams.playerToken}
        playerId={gameParams.playerId}
        playerSlot={gameParams.playerSlot}
        playerName={playerName}
        onBackToMenu={navigateToMenu}
      />
    );
  }

  if (page === 'history') {
    return <HistoryPage onBack={navigateToMenu} />;
  }

  return null;
}

export default App;
