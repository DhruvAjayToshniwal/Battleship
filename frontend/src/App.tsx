import { useState, useCallback } from 'react';
import './styles/globals.css';
import { useSessionRestore } from './hooks/useSessionRestore';
import MenuPage from './pages/MenuPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import HistoryPage from './pages/HistoryPage';
import { clearSession } from './services/session';

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

  const handlePlayAI = useCallback(() => {
    setGameParams({
      mode: 'ai',
      roomId: null,
      playerToken: null,
      playerId: null,
      playerSlot: null,
    });
    setPage('game');
  }, []);

  const handlePlayMultiplayer = useCallback(() => {
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
        className="w-full h-full flex items-center justify-center"
        style={{ background: '#0a0e1a' }}
      >
        <p
          className="text-sm tracking-widest uppercase animate-pulse"
          style={{ color: '#38bdf8' }}
        >
          Restoring session...
        </p>
      </div>
    );
  }

  if (sessionRestore.session && sessionRestore.reconnectData && page === 'menu') {
    const session = sessionRestore.session;
    const reconnect = sessionRestore.reconnectData;

    if (reconnect.room_status !== 'finished' && reconnect.room_status !== 'abandoned') {
      return (
        <GamePage
          mode={session.mode}
          roomId={session.roomId}
          playerToken={session.playerToken}
          playerId={session.playerId}
          playerSlot={session.playerSlot}
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
