type WSMessage =
  | { type: "user_list"; users: any[] }
  | { type: "signal"; fromUserId: string; signal: any }
  | { type: "ice_candidate"; fromUserId: string; candidate: any }
  | { type: "chat_message"; fromUserId: string; message: string };

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Function[]>();

  connect(userId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket("ws://localhost:3000");

    this.ws.onopen = () => {
      this.send({ type: "online", userId });
    };

    this.ws.onmessage = (event) => {
      const data: WSMessage = JSON.parse(event.data);

      const handlers = this.listeners.get(data.type) || [];
      handlers.forEach((fn) => fn(data));
    };

    this.ws.onclose = () => {
      this.ws = null;
    };
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
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