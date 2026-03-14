import { useState, useCallback, useRef } from 'react';
import type { ShotResult, TurnResult, MultiplayerShotResult } from '../services/api';
import { speak } from './useVoiceCommander';

export type Phase = 'setup' | 'playing' | 'gameOver';

interface AudioCallbacks {
  playMissileLaunch: () => void;
  playExplosion: () => void;
  playSplash: () => void;
  playShipSunk: () => void;
  playVictory: () => void;
  playDefeat: () => void;
  playTurnStart: () => void;
  playEnemyFire: () => void;
}

interface BattleSequenceOptions {
  audio: AudioCallbacks;
  onFireShot: (gameId: string, coordinate: string) => Promise<TurnResult | MultiplayerShotResult | null>;
  onRefreshState: (gameId: string) => Promise<{ game_status: string } | null>;
  firedCoords: Set<string>;
  mode?: 'ai' | 'human';
}

export function useBattleSequence({
  audio,
  onFireShot,
  onRefreshState,
  firedCoords,
  mode = 'ai',
}: BattleSequenceOptions) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isFiring, setIsFiring] = useState(false);
  const [lastPlayerResult, setLastPlayerResult] = useState<ShotResult | null>(null);
  const [lastAiResult, setLastAiResult] = useState<ShotResult | null>(null);
  const [message, setMessage] = useState('Deploy your fleet, Commander.');
  const sequenceLock = useRef(false);

  const startBattle = useCallback(() => {
    setPhase('playing');
    setMessage('All ships deployed. Open fire, Commander!');
    setIsPlayerTurn(true);
    setIsFiring(false);
    setLastPlayerResult(null);
    setLastAiResult(null);
  }, []);

  const resetBattle = useCallback(() => {
    setPhase('setup');
    setMessage('Deploy your fleet, Commander.');
    setIsPlayerTurn(true);
    setIsFiring(false);
    setLastPlayerResult(null);
    setLastAiResult(null);
    sequenceLock.current = false;
  }, []);

  const processPlayerShot = useCallback((shot: ShotResult) => {
    try {
      setLastPlayerResult(shot);
      if (shot.result === 'hit' || shot.result === 'sunk') {
        const shipName = shot.ship;
        if (shot.result === 'sunk') {
          setMessage(`Direct hit! ${shipName} sunk!`);
          audio.playShipSunk();
          speak('playerSunk');
        } else {
          setMessage(`Hit! ${shipName ? shipName + ' damaged!' : ''}`);
          audio.playExplosion();
          speak('playerHit');
        }
      } else {
        setMessage('Miss. Splash.');
        audio.playSplash();
        speak('playerMiss');
      }
    } catch (e) {
      console.error('Error processing player shot:', e);
    }
  }, [audio]);

  const processEnemyShot = useCallback((shot: ShotResult) => {
    try {
      setLastAiResult(shot);
      if (shot.result === 'hit' || shot.result === 'sunk') {
        if (shot.result === 'sunk') {
          setMessage(`Enemy sunk our ${shot.ship}!`);
          audio.playShipSunk();
          speak('enemySunk');
        } else {
          setMessage(`Enemy hit our ${shot.ship || 'ship'}!`);
          audio.playExplosion();
          speak('enemyHit');
        }
      } else {
        setMessage('Enemy missed!');
        audio.playSplash();
        speak('enemyMiss');
      }
    } catch (e) {
      console.error('Error processing enemy shot:', e);
    }
  }, [audio]);

  const receiveOpponentShot = useCallback((shot: ShotResult) => {
    try {
      audio.playEnemyFire();
      setTimeout(() => {
        processEnemyShot(shot);
      }, 800);
    } catch (e) {
      console.error('Error receiving opponent shot:', e);
    }
  }, [audio, processEnemyShot]);

  const receiveGameUpdate = useCallback((status: string, isMyTurn: boolean) => {
    try {
      if (status === 'player_wins') {
        setPhase('gameOver');
        setMessage('VICTORY! All enemy ships destroyed!');
        audio.playVictory();
        speak('victory');
      } else if (status === 'ai_wins') {
        setPhase('gameOver');
        setMessage('DEFEAT. Our fleet has been destroyed.');
        audio.playDefeat();
        speak('defeat');
      } else {
        setIsPlayerTurn(isMyTurn);
        if (isMyTurn) {
          setMessage('Your turn, Commander.');
          audio.playTurnStart();
          speak('turnStart');
        } else {
          setMessage('Waiting for opponent...');
        }
      }
    } catch (e) {
      console.error('Error receiving game update:', e);
    }
  }, [audio]);

  const fireShot = useCallback(
    async (gameId: string, coordinate: string) => {
      if (phase !== 'playing' || !isPlayerTurn || isFiring) return;
      if (firedCoords.has(coordinate)) return;
      if (sequenceLock.current) return;
      sequenceLock.current = true;

      setIsFiring(true);
      setIsPlayerTurn(false);
      setMessage('Firing...');
      audio.playMissileLaunch();
      speak('firing');

      try {
        const response = await onFireShot(gameId, coordinate);
        if (!response) {
          setIsPlayerTurn(true);
          return;
        }

        if (mode === 'ai') {
          const aiResponse = response as TurnResult;
          processPlayerShot(aiResponse.player_shot);

          await new Promise((r) => setTimeout(r, 1200));

          if (aiResponse.ai_shot) {
            setMessage('Enemy is firing...');
            audio.playEnemyFire();
            await new Promise((r) => setTimeout(r, 800));
            processEnemyShot(aiResponse.ai_shot);
          }

          const updatedState = await onRefreshState(gameId);

          if (
            updatedState?.game_status === 'player_wins' ||
            aiResponse.game_status === 'player_wins'
          ) {
            setPhase('gameOver');
            setMessage('VICTORY! All enemy ships destroyed!');
            audio.playVictory();
            speak('victory');
          } else if (
            updatedState?.game_status === 'ai_wins' ||
            aiResponse.game_status === 'ai_wins'
          ) {
            setPhase('gameOver');
            setMessage('DEFEAT. Our fleet has been destroyed.');
            audio.playDefeat();
            speak('defeat');
          } else {
            await new Promise((r) => setTimeout(r, 800));
            setIsPlayerTurn(true);
            setMessage('Your turn, Commander.');
            audio.playTurnStart();
            speak('turnStart');
          }
        } else {
          const mpResponse = response as MultiplayerShotResult;
          processPlayerShot(mpResponse.shot);
        }
      } catch {
        setIsPlayerTurn(true);
      } finally {
        setIsFiring(false);
        sequenceLock.current = false;
      }
    },
    [phase, isPlayerTurn, isFiring, firedCoords, audio, onFireShot, onRefreshState, mode, processPlayerShot, processEnemyShot]
  );

  return {
    phase,
    setPhase,
    isPlayerTurn,
    setIsPlayerTurn,
    isFiring,
    lastPlayerResult,
    lastAiResult,
    message,
    setMessage,
    startBattle,
    resetBattle,
    fireShot,
    receiveOpponentShot,
    receiveGameUpdate,
  };
}
