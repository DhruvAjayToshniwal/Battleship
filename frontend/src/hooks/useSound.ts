import { useRef, useCallback, useEffect } from 'react';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  fadeOut: number = 0.1
) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + fadeOut);
}

function playNoise(duration: number, volume: number = 0.1, bandpass: number = 1000) {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = bandpass;
  filter.Q.value = 1;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function playMissileLaunch() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.7);

  playNoise(0.4, 0.08, 2000);
}

export function playExplosion() {
  const ctx = getAudioContext();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);

  playNoise(0.6, 0.2, 500);

  setTimeout(() => {
    playNoise(0.3, 0.1, 200);
  }, 100);
}

export function playSplash() {
  playNoise(0.5, 0.15, 3000);

  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}

export function playShipPlace() {
  playTone(440, 0.08, 'sine', 0.15);
  setTimeout(() => playTone(660, 0.08, 'sine', 0.15), 60);
  setTimeout(() => playTone(880, 0.12, 'sine', 0.12), 120);
}

export function playShipSunk() {
  const ctx = getAudioContext();

  playExplosion();

  setTimeout(() => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.1);
  }, 300);
}

export function playGameStart() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.12), i * 120);
  });

  setTimeout(() => {
    playTone(1047, 0.4, 'triangle', 0.1);
  }, notes.length * 120);
}

export function playVictory() {
  const melody = [523, 659, 784, 1047, 784, 1047, 1319, 1047, 1319];
  melody.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.18, 'sine', 0.12), i * 140);
  });

  setTimeout(() => {
    playTone(1319, 0.6, 'triangle', 0.15);
    playTone(1047, 0.6, 'triangle', 0.1);
  }, melody.length * 140);
}

export function playDefeat() {
  const melody = [440, 415, 392, 370, 349, 330, 311, 293];
  melody.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, 'sine', 0.12), i * 180);
  });

  setTimeout(() => {
    playTone(220, 1.0, 'triangle', 0.1);
  }, melody.length * 180);
}

export function playTurnStart() {
  playTone(880, 0.06, 'sine', 0.1);
  setTimeout(() => playTone(1100, 0.08, 'sine', 0.08), 80);
}

export function playEnemyFire() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.4);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
}

let ambientOscillators: OscillatorNode[] = [];
let ambientGains: GainNode[] = [];
let ambientPlaying = false;

export function startAmbience() {
  if (ambientPlaying) return;
  ambientPlaying = true;

  const ctx = getAudioContext();

  const freqs = [55, 82.5, 110];
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.02;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    ambientOscillators.push(osc);
    ambientGains.push(gain);
  });

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.15;
  lfoGain.gain.value = 0.01;
  lfo.connect(lfoGain);
  ambientGains.forEach((g) => lfoGain.connect(g.gain));
  lfo.start();
  ambientOscillators.push(lfo);
}

export function stopAmbience() {
  ambientPlaying = false;
  ambientOscillators.forEach((osc) => {
    try { osc.stop(); } catch (e) {}
  });
  ambientOscillators = [];
  ambientGains = [];
}

export function useSound() {
  const ambientStarted = useRef(false);

  const initAudio = useCallback(() => {
    getAudioContext();
    if (!ambientStarted.current) {
      ambientStarted.current = true;
      startAmbience();
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
      stopAmbience();
    };
  }, [initAudio]);

  return {
    playMissileLaunch,
    playExplosion,
    playSplash,
    playShipPlace,
    playShipSunk,
    playGameStart,
    playVictory,
    playDefeat,
    playTurnStart,
    playEnemyFire,
    startAmbience,
    stopAmbience,
  };
}
