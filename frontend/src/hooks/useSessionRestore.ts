import { useEffect, useState } from 'react';
import { isInGame, clearSession } from '../services/session';
import * as api from '../services/api';

interface SessionRestoreResult {
  loading: boolean;
  reconnectData: api.ReconnectResponse | null;
}

export function useSessionRestore(): SessionRestoreResult {
  const [loading, setLoading] = useState(true);
  const [reconnectData, setReconnectData] = useState<api.ReconnectResponse | null>(null);

  useEffect(() => {
    async function tryRestore() {
      try {
        if (!isInGame()) {
          setLoading(false);
          return;
        }

        try {
          const data = await api.reconnectRoom();
          if (data.room_status === 'finished' || data.room_status === 'abandoned') {
            clearSession();
            setLoading(false);
            return;
          }

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

  return { loading, reconnectData };
}
