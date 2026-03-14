import { useEffect, useState } from 'react';
import { loadSession, clearSession, type StoredSession } from '../services/session';
import * as api from '../services/api';

interface SessionRestoreResult {
  loading: boolean;
  session: StoredSession | null;
  reconnectData: api.ReconnectResponse | null;
}

export function useSessionRestore(): SessionRestoreResult {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [reconnectData, setReconnectData] = useState<api.ReconnectResponse | null>(null);

  useEffect(() => {
    async function tryRestore() {
      try {
        const stored = loadSession();
        if (!stored) {
          setLoading(false);
          return;
        }

        try {
          const data = await api.reconnectRoom(stored.roomId, stored.playerToken);
          if (data.room_status === 'finished' || data.room_status === 'abandoned') {
            clearSession();
            setLoading(false);
            return;
          }

          setSession(stored);
          setReconnectData(data);
        } catch (e) {
          clearSession();
        }
      } catch (e) {
        clearSession();
      } finally {
        setLoading(false);
      }
    }

    tryRestore();
  }, []);

  return { loading, session, reconnectData };
}
