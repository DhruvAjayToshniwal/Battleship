import gsap from 'gsap';
import type * as THREE from 'three';

function shakeCamera(
  camera: THREE.PerspectiveCamera,
  intensity: number = 0.3,
  duration: number = 0.4
): gsap.core.Tween {
  try {
    const originalX = camera.position.x;
    const originalY = camera.position.y;
    const originalZ = camera.position.z;

    return gsap.to(camera.position, {
      x: originalX + (Math.random() - 0.5) * intensity,
      y: originalY + (Math.random() - 0.5) * intensity * 0.5,
      z: originalZ + (Math.random() - 0.5) * intensity,
      duration: duration / 6,
      repeat: 5,
      yoyo: true,
      ease: 'power2.inOut',
      onComplete: () => {
        try {
          camera.position.set(originalX, originalY, originalZ);
        } catch {
          // noop
        }
      },
    });
  } catch {
    return gsap.to({}, { duration: 0 });
  }
}

function zoomPunch(
  camera: THREE.PerspectiveCamera,
  duration: number = 0.6
): gsap.core.Tween {
  try {
    const originalFov = camera.fov;
    const punchFov = originalFov - 8;

    return gsap.to(camera, {
      fov: punchFov,
      duration: duration * 0.3,
      ease: 'power2.out',
      onUpdate: () => {
        try {
          camera.updateProjectionMatrix();
        } catch {
          // noop
        }
      },
      onComplete: () => {
        try {
          gsap.to(camera, {
            fov: originalFov,
            duration: duration * 0.7,
            ease: 'power2.inOut',
            onUpdate: () => {
              try {
                camera.updateProjectionMatrix();
              } catch {
                // noop
              }
            },
          });
        } catch {
          // noop
        }
      },
    });
  } catch {
    return gsap.to({}, { duration: 0 });
  }
}

export { shakeCamera, zoomPunch };
