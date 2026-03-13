interface SequenceStep {
  time: number
  camera?: {
    position: [number, number, number]
    target: [number, number, number]
    fov: number
  }
  action?: string
}

const INTRO_SEQUENCE: SequenceStep[] = [
  {
    time: 0,
    camera: { position: [0, 80, 60], target: [0, 0, 0], fov: 40 },
    action: 'fade-in',
  },
  {
    time: 1.5,
    camera: { position: [0, 50, 45], target: [0, 0, 5], fov: 45 },
    action: 'show-title',
  },
  {
    time: 3.0,
    camera: { position: [0, 35, 30], target: [0, 0, 5], fov: 50 },
    action: 'show-boards',
  },
]

const FIRE_SEQUENCE: SequenceStep[] = [
  { time: 0, action: 'camera-to-target' },
  { time: 0.3, action: 'launch-missile' },
  { time: 1.0, action: 'camera-zoom-impact' },
  { time: 1.2, action: 'impact' },
  { time: 1.4, action: 'camera-shake' },
  { time: 2.5, action: 'camera-return' },
]

const VICTORY_SEQUENCE: SequenceStep[] = [
  { time: 0, action: 'start-orbit' },
  { time: 0.5, action: 'show-overlay' },
  { time: 2.0, action: 'fireworks' },
]

const DEFEAT_SEQUENCE: SequenceStep[] = [
  { time: 0, action: 'camera-pullback' },
  { time: 1.0, action: 'show-overlay' },
  { time: 2.0, action: 'dim-scene' },
]

export { INTRO_SEQUENCE, FIRE_SEQUENCE, VICTORY_SEQUENCE, DEFEAT_SEQUENCE }
export type { SequenceStep }
