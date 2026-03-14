export type WsEventType =
  | 'room.player_joined'
  | 'game.placement_ready'
  | 'game.started'
  | 'game.move'
  | 'game.state'
  | 'game.finished'
  | 'player.disconnected'
  | 'player.reconnected'
  | 'error'
  | 'connected'
  | 'disconnected'
  | 'heartbeat';

export interface WsEvent {
  type: WsEventType;
  data: Record<string, unknown>;
}

export type WsListener = (event: WsEvent) => void;

function getWsBaseUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}

export class RoomSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<WsListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private intentionalClose = false;
  private roomId: string;
  private token: string;

  constructor(roomId: string, token: string) {
    this.roomId = roomId;
    this.token = token;
  }

  connect(): void {
    try {
      const url = `${getWsBaseUrl()}/ws/rooms/${this.roomId}?token=${this.token}`;
      this.ws = new WebSocket(url);
      this.intentionalClose = false;

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.dispatch({ type: 'connected', data: {} });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          this.dispatch(parsed as WsEvent);
        } catch (e) {
          this.dispatch({ type: 'error', data: { message: 'Failed to parse message' } });
        }
      };

      this.ws.onclose = () => {
        this.dispatch({ type: 'disconnected', data: {} });
        if (!this.intentionalClose) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = () => {
        this.dispatch({ type: 'error', data: { message: 'WebSocket error' } });
      };
    } catch (e) {
      throw new Error(`Failed to connect WebSocket: ${e}`);
    }
  }

  disconnect(): void {
    try {
      this.intentionalClose = true;
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    } catch (e) {
      throw new Error(`Failed to disconnect WebSocket: ${e}`);
    }
  }

  send(event: WsEvent): void {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(event));
      }
    } catch (e) {
      throw new Error(`Failed to send WebSocket message: ${e}`);
    }
  }

  on(type: string, listener: WsListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  off(type: string, listener: WsListener): void {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(listener);
    }
  }

  private dispatch(event: WsEvent): void {
    try {
      const typeListeners = this.listeners.get(event.type);
      if (typeListeners) {
        typeListeners.forEach((listener) => {
          try {
            listener(event);
          } catch (e) {
            console.error('WS listener error:', e);
          }
        });
      }

      const allListeners = this.listeners.get('*');
      if (allListeners) {
        allListeners.forEach((listener) => {
          try {
            listener(event);
          } catch (e) {
            console.error('WS listener error:', e);
          }
        });
      }
    } catch (e) {
      console.error('WS dispatch error:', e);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    setTimeout(() => {
      if (!this.intentionalClose) {
        this.connect();
      }
    }, delay);
  }
}
