import gsap from 'gsap';
import type * as THREE from 'three';

function emphasisShift(
  camera: THREE.PerspectiveCamera,
  side: 'player' | 'enemy',
  duration: number = 1.2
): gsap.core.Tween {
  try {
    const xOffset = side === 'player' ? -1.5 : 1.5;

    return gsap.to(camera.position, {
      x: camera.position.x + xOffset,
      duration,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: 0,
    });
  } catch {
    return gsap.to({}, { duration: 0 });
  }
}

export { emphasisShift };
