const CLIENT_ID_KEY = 'battleship_client_id';

export function getClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  } catch (e) {
    try {
      return crypto.randomUUID();
    } catch (e2) {
      throw new Error(`Failed to generate client ID: ${e2}`);
    }
  }
}
