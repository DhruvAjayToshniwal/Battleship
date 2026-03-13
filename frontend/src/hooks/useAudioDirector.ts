import { useRef, useCallback, useEffect } from 'react';
import {
  playMissileLaunch as rawMissileLaunch,
  playExplosion as rawExplosion,
  playSplash as rawSplash,
  playShipPlace as rawShipPlace,
  playShipSunk as rawShipSunk,
  playGameStart as rawGameStart,
  playVictory as rawVictory,
  playDefeat as rawDefeat,
  playTurnStart as rawTurnStart,
  playEnemyFire as rawEnemyFire,
  startAmbience,
  stopAmbience,
} from './useSound';

function safeSoundCall(fn: () => void): void {
  try {
    fn();
  } catch {
  }
}

export function useAudioDirector() {
  const ambientStarted = useRef(false);

  const initAudio = useCallback(() => {
    if (!ambientStarted.current) {
      ambientStarted.current = true;
      safeSoundCall(startAmbience);
    }
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      safeSoundCall(stopAmbience);
    };
  }, [initAudio]);

  return {
    playMissileLaunch: () => safeSoundCall(rawMissileLaunch),
    playExplosion: () => safeSoundCall(rawExplosion),
    playSplash: () => safeSoundCall(rawSplash),
    playShipPlace: () => safeSoundCall(rawShipPlace),
    playShipSunk: () => safeSoundCall(rawShipSunk),
    playGameStart: () => safeSoundCall(rawGameStart),
    playVictory: () => safeSoundCall(rawVictory),
    playDefeat: () => safeSoundCall(rawDefeat),
    playTurnStart: () => safeSoundCall(rawTurnStart),
    playEnemyFire: () => safeSoundCall(rawEnemyFire),
  };
}
