import { useState, useCallback, useRef } from 'react';
import type { ShotResult, TurnResult } from '../services/api';
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
  onFireShot: (gameId: string, coordinate: string) => Promise<TurnResult | null>;
  onRefreshState: (gameId: string) => Promise<{ game_status: string } | null>;
  firedCoords: Set<string>;
}

export function useBattleSequence({
  audio,
  onFireShot,
  onRefreshState,
  firedCoords,
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

        const playerShot = response.player_shot;
        setLastPlayerResult(playerShot);

        if (playerShot.result === 'hit' || playerShot.result === 'sunk') {
          const shipName = playerShot.ship;
          if (playerShot.result === 'sunk') {
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

        await new Promise((r) => setTimeout(r, 1200));

        if (response.ai_shot) {
          setMessage('Enemy is firing...');
          audio.playEnemyFire();
          await new Promise((r) => setTimeout(r, 800));

          setLastAiResult(response.ai_shot);

          if (
            response.ai_shot.result === 'hit' ||
            response.ai_shot.result === 'sunk'
          ) {
            if (response.ai_shot.result === 'sunk') {
              setMessage(`Enemy sunk our ${response.ai_shot.ship}!`);
              audio.playShipSunk();
              speak('enemySunk');
            } else {
              setMessage(`Enemy hit our ${response.ai_shot.ship || 'ship'}!`);
              audio.playExplosion();
              speak('enemyHit');
            }
          } else {
            setMessage('Enemy missed!');
            audio.playSplash();
            speak('enemyMiss');
          }
        }

        const updatedState = await onRefreshState(gameId);

        if (
          updatedState?.game_status === 'player_wins' ||
          response.game_status === 'player_wins'
        ) {
          setPhase('gameOver');
          setMessage('VICTORY! All enemy ships destroyed!');
          audio.playVictory();
          speak('victory');
        } else if (
          updatedState?.game_status === 'ai_wins' ||
          response.game_status === 'ai_wins'
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
      } catch {
        setIsPlayerTurn(true);
      } finally {
        setIsFiring(false);
        sequenceLock.current = false;
      }
    },
    [phase, isPlayerTurn, isFiring, firedCoords, audio, onFireShot, onRefreshState]
  );

  return {
    phase,
    isPlayerTurn,
    isFiring,
    lastPlayerResult,
    lastAiResult,
    message,
    startBattle,
    resetBattle,
    fireShot,
  };
}
