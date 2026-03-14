import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useRealtimeRoom } from '../hooks/useRealtimeRoom';
import SceneRoot from '../scene/SceneRoot';
import ShipPlacement from '../components/ShipPlacement';
import CommandHUD from '../components/hud/CommandHUD';

import TurnBanner from '../components/hud/TurnBanner';
import FireControlPanel from '../components/hud/FireControlPanel';
import NotificationStack from '../components/hud/NotificationStack';
import IntroOverlay from '../components/overlays/IntroOverlay';
import VictoryOverlay from '../components/overlays/VictoryOverlay';
import DefeatOverlay from '../components/overlays/DefeatOverlay';
import LoadingOverlay from '../components/overlays/LoadingOverlay';
import NetworkErrorOverlay from '../components/overlays/NetworkErrorOverlay';
import CommanderCallout from '../components/hud/CommanderCallout';
import type { Difficulty, ShotResult, GameStateResponse } from '../services/api';
import { clearSession } from '../services/session';

interface GamePageProps {
  mode?: 'ai' | 'human';
  roomId?: string | null;
  playerToken?: string | null;
  playerId?: string | null;
  playerSlot?: string | null;
  playerName?: string;
  onBackToMenu?: () => void;
}

export default function GamePage({
  mode = 'ai',
  roomId = null,
  playerToken = null,
  playerId = null,
  playerName = 'Player',
  onBackToMenu,
}: GamePageProps) {
  const game = useGame({ mode, roomId, playerToken, playerId, playerName });

  const [hoverCoord, setHoverCoord] = useState<[number, number] | null>(null);
  const [enemyHoverCell, setEnemyHoverCell] = useState<[number, number] | null>(null);
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const prevTurnRef = useRef(game.isPlayerTurn);

  const handleGameMove = useCallback((data: Record<string, unknown>) => {
    try {
      const actorId = data.actor_player_id as string;
      const shot = data.shot as ShotResult;

      if (actorId !== playerId && shot) {
        game.receiveOpponentShot(shot);
      }

      const gameStatus = data.game_status as string;
      const nextTurn = data.next_turn as string | null;

      if (gameStatus === 'player_wins' || gameStatus === 'ai_wins') {
        const iWon = actorId === playerId && gameStatus === 'player_wins';
        const winStatus = iWon ? 'player_wins' : 'ai_wins';
        game.receiveGameUpdate(winStatus, false);
      } else if (nextTurn) {
        game.receiveGameUpdate('playing', nextTurn === playerId);
      }
    } catch (e) {
      console.error('Error handling game move:', e);
    }
  }, [playerId, game]);

  const handleGameState = useCallback((data: Record<string, unknown>) => {
    try {
      if (data.player_board && data.game_status) {
        const stateData = data as unknown as GameStateResponse;
        const mapped: GameStateResponse = {
          game_id: stateData.game_id || roomId || '',
          game_status: (stateData.game_status || 'setup') as GameStateResponse['game_status'],
          player_board: stateData.player_board || { ships: [], shots_received: [] },
          ai_board: (data as Record<string, unknown>).opponent_board
            ? ((data as Record<string, unknown>).opponent_board as GameStateResponse['ai_board'])
            : stateData.ai_board || { ships: [], hits: [], misses: [] },
          player_shots: (data as Record<string, unknown>).my_shots
            ? ((data as Record<string, unknown>).my_shots as ShotResult[])
            : stateData.player_shots || [],
          ai_shots: (data as Record<string, unknown>).opponent_shots
            ? ((data as Record<string, unknown>).opponent_shots as ShotResult[])
            : stateData.ai_shots || [],
          player_ships_remaining: ((data as Record<string, unknown>).my_ships_remaining as number)
            ?? stateData.player_ships_remaining ?? 5,
          ai_ships_remaining: ((data as Record<string, unknown>).opponent_ships_remaining as number)
            ?? stateData.ai_ships_remaining ?? 5,
        };
        game.setGameState(mapped);

        const yourTurn = (data as Record<string, unknown>).your_turn as boolean | undefined;
        if (yourTurn !== undefined) {
          game.setIsPlayerTurn(yourTurn);
        }

        if (mapped.game_status === 'playing' && game.phase === 'setup') {
          game.startBattle();
        }
      }
    } catch (e) {
      console.error('Error handling game state:', e);
    }
  }, [game, roomId]);

  const handleGameStarted = useCallback(() => {
    try {
      game.startBattle();
    } catch (e) {
      console.error('Error handling game started:', e);
    }
  }, [game]);

  const handleGameFinished = useCallback((data: Record<string, unknown>) => {
    try {
      const winner = data.winner as string;
      const iWon = winner === playerId;
      game.receiveGameUpdate(iWon ? 'player_wins' : 'ai_wins', false);
    } catch (e) {
      console.error('Error handling game finished:', e);
    }
  }, [game, playerId]);

  useRealtimeRoom({
    roomId: roomId || '',
    playerToken: playerToken || '',
    playerId: playerId || '',
    enabled: mode === 'human' && !!roomId,
    onGameMove: handleGameMove,
    onGameState: handleGameState,
    onGameStarted: handleGameStarted,
    onGameFinished: handleGameFinished,
    onPlacementReady: () => {
      game.setMessage('Opponent has placed their ships.');
    },
  });

  useEffect(() => {
    if (mode === 'ai') {
      game.startGame();
    }
  }, []);

  useEffect(() => {
    if (!game.loading && showIntro && game.phase === 'setup') {
      const timer = setTimeout(() => setShowIntro(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [game.loading, showIntro, game.phase]);

  useEffect(() => {
    if (game.phase !== 'playing') return;
    if (prevTurnRef.current !== game.isPlayerTurn) {
      prevTurnRef.current = game.isPlayerTurn;
      setShowTurnBanner(true);
      const timer = setTimeout(() => setShowTurnBanner(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [game.isPlayerTurn, game.phase]);

  const previewCoords = useMemo(() => {
    if (game.phase !== 'setup' || !hoverCoord || !game.currentShip) return null;
    return game.getShipPreview(hoverCoord[0], hoverCoord[1]);
  }, [game.phase, hoverCoord, game.currentShip, game.getShipPreview]);

  const handlePlayerBoardClick = useCallback(
    (row: number, col: number) => {
      if (game.phase === 'setup') {
        setHoverCoord([row, col]);
        game.placeShipAt(row, col);
      }
    },
    [game.phase, game.placeShipAt]
  );

  const handlePlayerBoardHover = useCallback(
    (row: number, col: number) => {
      if (game.phase === 'setup') {
        setHoverCoord([row, col]);
      }
    },
    [game.phase]
  );

  const handleEnemyCellClick = useCallback(
    (...args: [number, number, string]) => {
      setEnemyHoverCell([args[0], args[1]]);
      const coordinate = args[2];
      if (game.phase === 'playing' && game.isPlayerTurn && !game.isFiring) {
        game.fireShot(coordinate);
      }
    },
    [game.phase, game.isPlayerTurn, game.isFiring, game.fireShot]
  );

  const handleRestart = useCallback(
    (diff?: Difficulty) => {
      if (mode === 'human' && onBackToMenu) {
        clearSession();
        onBackToMenu();
        return;
      }
      setShowIntro(true);
      game.startGame(diff);
    },
    [mode, onBackToMenu, game.startGame]
  );

  const handleBackToMenu = useCallback(() => {
    clearSession();
    onBackToMenu?.();
  }, [onBackToMenu]);

  const playerShipCoords = game.placedShips.map((s) => s.coordinates);

  const playingPlayerShipCoords = useMemo(() => {
    if (game.phase !== 'setup' && game.gameState?.player_board?.ships) {
      return game.gameState.player_board.ships
        .filter((s) => s.coordinates)
        .map((s) => s.coordinates);
    }
    return playerShipCoords;
  }, [game.phase, game.gameState, playerShipCoords]);

  const enemyShipCoords = useMemo(() => {
    if (game.gameState?.ai_board?.ships) {
      return game.gameState.ai_board.ships
        .filter((s) => s.coordinates && s.coordinates.length > 0)
        .map((s) => s.coordinates);
    }
    return [];
  }, [game.gameState]);

  const targetCoord = useMemo(() => {
    if (!enemyHoverCell) return null;
    const [row, col] = enemyHoverCell;
    const letter = String.fromCharCode(65 + col);
    return `${letter}${row + 1}`;
  }, [enemyHoverCell]);

  const lastFireCoord = game.lastPlayerResult?.coordinate ?? null;
  const boardSpacing = 7;

  const isPlayerWin = game.gameState?.game_status === 'player_wins';
  const isAiWin = game.gameState?.game_status === 'ai_wins';

  return (
    <div className="w-full h-full relative" style={{ background: '#0a0e1a' }}>
      <Canvas
        camera={{
          position: [0, 35, 30],
          fov: 50,
          near: 0.1,
          far: 200,
        }}
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={() => {
          setHoverCoord(null);
          setEnemyHoverCell(null);
        }}
        shadows
      >
        <SceneRoot
          phase={game.phase}
          isPlayerTurn={game.isPlayerTurn}
          isFiring={game.isFiring}
          lastFireCoord={lastFireCoord}
          boardSpacing={boardSpacing}
          playerGrid={game.localPlayerGrid}
          aiGrid={game.aiGrid}
          playerShipCoordinates={playingPlayerShipCoords}
          enemyShipCoordinates={enemyShipCoords}
          previewCoords={previewCoords}
          lastPlayerResult={game.lastPlayerResult}
          lastAiResult={game.lastAiResult}
          isPlayerBoardClickable={game.phase === 'setup'}
          isEnemyBoardClickable={game.phase === 'playing' && game.isPlayerTurn && !game.isFiring}
          onPlayerCellClick={(row, col) => {
            handlePlayerBoardHover(row, col);
            handlePlayerBoardClick(row, col);
          }}
          onEnemyCellClick={handleEnemyCellClick}
          enemyHoverCell={enemyHoverCell}
        />
      </Canvas>

      <CommandHUD
        phase={game.phase}
        gameState={game.gameState}
        isPlayerTurn={game.isPlayerTurn}
        message={game.message}
        difficulty={game.difficulty}
        onRestart={handleRestart}
        onChangeDifficulty={game.changeDifficulty}
        loading={game.loading}
        mode={mode}
        playerName={playerName}
        onBackToMenu={handleBackToMenu}
      />

      <AnimatePresence>
        {game.phase === 'setup' && game.allShipsPlaced !== undefined && (
          <ShipPlacement
            shipsToPlace={game.shipsToPlace}
            currentShipIndex={game.currentShipIndex}
            placedShips={game.placedShips}
            allShipsPlaced={game.allShipsPlaced}
            orientation={game.orientation}
            difficulty={game.difficulty}
            onChangeDifficulty={game.changeDifficulty}
            onAutoPlace={game.autoPlace}
            onConfirm={game.confirmPlacement}
            onUndo={game.undoLastShip}
            loading={game.loading}
            hidesDifficulty={mode === 'human'}
          />
        )}
      </AnimatePresence>

      <TurnBanner isPlayerTurn={game.isPlayerTurn} visible={showTurnBanner} />

      <FireControlPanel
        visible={game.phase === 'playing'}
        targetCoord={targetCoord}
        isPlayerTurn={game.isPlayerTurn}
        isFiring={game.isFiring}
      />

      <NotificationStack
        message={game.message}
        lastResult={game.lastPlayerResult}
      />

      <CommanderCallout />

      <IntroOverlay visible={showIntro} />

      <VictoryOverlay
        visible={game.phase === 'gameOver' && (isPlayerWin || false)}
        difficulty={game.difficulty}
        gameState={game.gameState}
        onRestart={handleRestart}
        onChangeDifficulty={game.changeDifficulty}
        loading={game.loading}
        isMultiplayer={mode === 'human'}
        onBackToMenu={handleBackToMenu}
      />

      <DefeatOverlay
        visible={game.phase === 'gameOver' && (isAiWin || false)}
        difficulty={game.difficulty}
        gameState={game.gameState}
        onRestart={handleRestart}
        onChangeDifficulty={game.changeDifficulty}
        loading={game.loading}
        isMultiplayer={mode === 'human'}
        onBackToMenu={handleBackToMenu}
      />

      <NetworkErrorOverlay
        error={game.error}
        onRetry={() => mode === 'ai' ? game.startGame() : null}
        onDismiss={game.clearError}
      />

      <LoadingOverlay
        visible={game.loading}
        message="Initializing naval command..."
      />
    </div>
  );
}
