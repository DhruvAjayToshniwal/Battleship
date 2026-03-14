import { useEffect, useRef, useState, useCallback } from 'react';
import { RoomSocket, type WsEvent } from '../services/ws';

interface UseRealtimeRoomOptions {
  roomId: string;
  playerToken: string;
  playerId: string;
  enabled?: boolean;
  onOpponentJoined?: (data: Record<string, unknown>) => void;
  onPlacementReady?: (data: Record<string, unknown>) => void;
  onGameStarted?: (data: Record<string, unknown>) => void;
  onGameMove?: (data: Record<string, unknown>) => void;
  onGameState?: (data: Record<string, unknown>) => void;
  onGameFinished?: (data: Record<string, unknown>) => void;
  onOpponentDisconnected?: () => void;
  onOpponentReconnected?: () => void;
  onError?: (message: string) => void;
}

export function useRealtimeRoom(options: UseRealtimeRoomOptions) {
  const [connected, setConnected] = useState(false);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const socketRef = useRef<RoomSocket | null>(null);

  const {
    roomId,
    playerToken,
    playerId,
    enabled = true,
    onOpponentJoined,
    onPlacementReady,
    onGameStarted,
    onGameMove,
    onGameState,
    onGameFinished,
    onOpponentDisconnected,
    onOpponentReconnected,
    onError,
  } = options;

  const callbacksRef = useRef({
    onOpponentJoined,
    onPlacementReady,
    onGameStarted,
    onGameMove,
    onGameState,
    onGameFinished,
    onOpponentDisconnected,
    onOpponentReconnected,
    onError,
  });

  callbacksRef.current = {
    onOpponentJoined,
    onPlacementReady,
    onGameStarted,
    onGameMove,
    onGameState,
    onGameFinished,
    onOpponentDisconnected,
    onOpponentReconnected,
    onError,
  };

  useEffect(() => {
    if (!enabled || !roomId || !playerToken) return;

    try {
      const socket = new RoomSocket(roomId, playerToken);
      socketRef.current = socket;

      socket.on('connected', () => {
        setConnected(true);
      });

      socket.on('disconnected', () => {
        setConnected(false);
      });

      socket.on('room.player_joined', (event: WsEvent) => {
        setOpponentConnected(true);
        callbacksRef.current.onOpponentJoined?.(event.data);
      });

      socket.on('game.placement_ready', (event: WsEvent) => {
        callbacksRef.current.onPlacementReady?.(event.data);
      });

      socket.on('game.started', (event: WsEvent) => {
        callbacksRef.current.onGameStarted?.(event.data);
      });

      socket.on('game.move', (event: WsEvent) => {
        callbacksRef.current.onGameMove?.(event.data);
      });

      socket.on('game.state', (event: WsEvent) => {
        callbacksRef.current.onGameState?.(event.data);
      });

      socket.on('game.finished', (event: WsEvent) => {
        callbacksRef.current.onGameFinished?.(event.data);
      });

      socket.on('player.disconnected', (event: WsEvent) => {
        if (event.data.player_id !== playerId) {
          setOpponentConnected(false);
          callbacksRef.current.onOpponentDisconnected?.();
        }
      });

      socket.on('player.reconnected', (event: WsEvent) => {
        if (event.data.player_id !== playerId) {
          setOpponentConnected(true);
          callbacksRef.current.onOpponentReconnected?.();
        }
      });

      socket.on('error', (event: WsEvent) => {
        callbacksRef.current.onError?.(event.data.message as string);
      });

      socket.connect();

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } catch (e) {
      console.error('Failed to setup realtime room:', e);
    }
  }, [roomId, playerToken, playerId, enabled]);

  const disconnect = useCallback(() => {
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    } catch (e) {
      console.error('Failed to disconnect:', e);
    }
  }, []);

  return {
    connected,
    opponentConnected,
    disconnect,
  };
}
