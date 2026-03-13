export const CAMERA_SHOTS = {
  introStart: {
    position: [0, 40, 35] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 55,
    duration: 3,
  },
  introEnd: {
    position: [0, 18, 16] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 50,
    duration: 2,
  },
  setup: {
    position: [-7, 16, 14] as [number, number, number],
    target: [-7, 0, 0] as [number, number, number],
    fov: 50,
    duration: 1.5,
  },
  battleOverview: {
    position: [0, 20, 18] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 48,
    duration: 1,
  },
  playerFocus: {
    position: [-7, 14, 12] as [number, number, number],
    target: [-7, 0, 0] as [number, number, number],
    fov: 50,
    duration: 1,
  },
  enemyFocus: {
    position: [7, 14, 12] as [number, number, number],
    target: [7, 0, 0] as [number, number, number],
    fov: 50,
    duration: 1,
  },
  missileFollow: {
    position: [3, 8, 6] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 55,
    duration: 0.6,
  },
  impactClose: {
    position: [2, 6, 4] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 60,
    duration: 0.3,
  },
  victoryOrbit: {
    position: [0, 12, 18] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 50,
    duration: 10,
  },
  defeatPullback: {
    position: [0, 30, 25] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 45,
    duration: 5,
  },
};
