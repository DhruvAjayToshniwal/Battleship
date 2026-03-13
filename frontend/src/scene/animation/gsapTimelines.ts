import type * as THREE from 'three'

interface CameraKeyframe {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  duration: number
  ease: string
}

const INTRO_SEQUENCE: CameraKeyframe[] = [
  { position: [0, 80, 60], target: [0, 0, 0], fov: 40, duration: 0, ease: 'none' },
  { position: [0, 50, 45], target: [0, 0, 5], fov: 45, duration: 2.0, ease: 'power2.out' },
  { position: [0, 35, 30], target: [0, 0, 5], fov: 50, duration: 1.5, ease: 'power1.inOut' },
]

const FIRE_SEQUENCE: CameraKeyframe[] = [
  { position: [7, 25, 20], target: [7, 0, 0], fov: 45, duration: 0.4, ease: 'power2.out' },
  { position: [7, 15, 12], target: [7, 0, 0], fov: 50, duration: 0.8, ease: 'power1.in' },
  { position: [0, 35, 30], target: [0, 0, 5], fov: 50, duration: 1.0, ease: 'power2.inOut' },
]

const VICTORY_ORBIT_SPEED = 0.3
const DEFEAT_PULLBACK_DURATION = 3.0

function lerpCamera(
  camera: THREE.PerspectiveCamera,
  target: { position: THREE.Vector3; lookAt: THREE.Vector3; fov: number },
  alpha: number
) {
  camera.position.lerp(target.position, alpha)
  camera.fov += (target.fov - camera.fov) * alpha
  camera.updateProjectionMatrix()
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export {
  INTRO_SEQUENCE,
  FIRE_SEQUENCE,
  VICTORY_ORBIT_SPEED,
  DEFEAT_PULLBACK_DURATION,
  lerpCamera,
  easeOutCubic,
  easeInOutQuad,
}
export type { CameraKeyframe }
