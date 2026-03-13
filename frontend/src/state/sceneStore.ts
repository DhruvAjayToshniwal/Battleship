import { create } from 'zustand';

interface SceneState {
  cameraMode: string;
  activeBoard: 'player' | 'enemy' | 'overview';
  effectsActive: boolean;
  setCameraMode: (mode: string) => void;
  setActiveBoard: (board: 'player' | 'enemy' | 'overview') => void;
  setEffectsActive: (active: boolean) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  cameraMode: 'intro',
  activeBoard: 'overview',
  effectsActive: true,
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setActiveBoard: (board) => set({ activeBoard: board }),
  setEffectsActive: (active) => set({ effectsActive: active }),
}));
