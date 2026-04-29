type WSMessage =
  | { type: "user_list"; users: any[] }
  | { type: "signal"; fromUserId: string; signal: any }
  | { type: "ice_candidate"; fromUserId: string; candidate: any }
  | { type: "chat_message"; fromUserId: string; message: string; timestamp: string };

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Function[]>();
  private messageQueue: any[] = [];
  private userId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(userId: string) {
    this.userId = userId;

    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "online", userId }));
      }
      return;
    }

    this._open(userId);
  }

  private _open(userId: string) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const defaultWsUrl = `${protocol}//${window.location.host}`;
    const wsUrl = import.meta.env.VITE_WS_URL || defaultWsUrl;

    const ws = new WebSocket(wsUrl);
    this.ws = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "online", userId }));

      const q = [...this.messageQueue];
      this.messageQueue = [];
      for (const msg of q) {
        ws.send(JSON.stringify(msg));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        const handlers = this.listeners.get(data.type) ?? [];
        handlers.forEach((fn) => fn(data));
      } catch {
      }
    };

    ws.onclose = () => {
      if (this.ws === ws) this.ws = null;
      if (this.userId) {
        this.reconnectTimer = setTimeout(() => {
          if (this.userId) this._open(this.userId);
        }, 2000);
      }
    };

    ws.onerror = () => ws.close();
  }

  disconnect() {
    this.userId = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.messageQueue = [];
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.messageQueue.push(data);
    }
  }

  on(type: string, cb: Function) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type)!.push(cb);
  }

  off(type: string, cb: Function) {
    const arr = this.listeners.get(type);
    if (!arr) return;
    this.listeners.set(type, arr.filter((f) => f !== cb));
  }
}

export const socketClient = new SocketClient();