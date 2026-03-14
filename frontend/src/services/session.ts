const SESSION_KEY = 'battleship_in_game';

export function markInGame(): void {
  try {
    localStorage.setItem(SESSION_KEY, '1');
  } catch (e) {
    throw new Error(`Failed to mark in game: ${e}`);
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    throw new Error(`Failed to clear session: ${e}`);
  }
}

export function isInGame(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}
