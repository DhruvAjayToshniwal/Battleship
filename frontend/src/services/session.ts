const SESSION_KEY = 'battleship_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface StoredSession {
  roomId: string;
  playerToken: string;
  mode: 'ai' | 'human';
  playerSlot: string;
  playerId: string;
  savedAt: number;
}

export function saveSession(data: Omit<StoredSession, 'savedAt'>): void {
  try {
    const session: StoredSession = { ...data, savedAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    throw new Error(`Failed to save session: ${e}`);
  }
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    if (Date.now() - session.savedAt > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch (e) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    throw new Error(`Failed to clear session: ${e}`);
  }
}

export function hasActiveSession(): boolean {
  return loadSession() !== null;
}
