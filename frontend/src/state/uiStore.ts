import { create } from 'zustand';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'danger';
  timestamp: number;
}

interface UIState {
  notifications: Notification[];
  hudVisible: boolean;
  overlayActive: string | null;
  addNotification: (message: string, type: Notification['type']) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setHudVisible: (visible: boolean) => void;
  setOverlayActive: (overlay: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  notifications: [],
  hudVisible: true,
  overlayActive: null,
  addNotification: (message, type) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: `${Date.now()}-${Math.random()}`,
          message,
          type,
          timestamp: Date.now(),
        },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
  setHudVisible: (visible) => set({ hudVisible: visible }),
  setOverlayActive: (overlay) => set({ overlayActive: overlay }),
}));
