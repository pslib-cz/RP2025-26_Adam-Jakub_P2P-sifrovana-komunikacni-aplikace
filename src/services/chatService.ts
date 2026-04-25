export interface ChatMessage {
  fromUserId: string;
  message: string;
  timestamp: string;
}

export interface Conversation {
  userId: string;
  username: string;
  lastMessage: string;
  lastMessageTime: string;
  isOnline: boolean;
  profilePicture?: string;
  unreadCount?: number;
}

export const chatService = {
  getKey(userId: string, targetId: string) {
    return `chat_${userId}_${targetId}`;
  },

  getMessages(userId: string, targetId: string): ChatMessage[] {
    const key = this.getKey(userId, targetId);
    return JSON.parse(localStorage.getItem(key) || "[]");
  },

  saveMessage(userId: string, targetId: string, msg: ChatMessage) {
    const key = this.getKey(userId, targetId);
    const messages = this.getMessages(userId, targetId);
    messages.push(msg);
    localStorage.setItem(key, JSON.stringify(messages));
  },

  buildConversations(userId: string, users: any[], serverConvos: any[] = []): Conversation[] {
    const map = new Map<string, Conversation>();

    for (const sc of serverConvos) {
      const user = users.find((u) => u.userId === sc.userId);
      map.set(sc.userId, {
        userId: sc.userId,
        username: user?.username || sc.userId,
        lastMessage: sc.lastMessage,
        lastMessageTime: sc.lastMessageTime,
        isOnline: user?.isOnline || false,
        unreadCount: sc.unreadCount || 0,
      });
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(`chat_${userId}_`)) continue;

      const targetId = key.split("_")[2];
      const messages = JSON.parse(localStorage.getItem(key) || "[]");
      if (!messages.length) continue;

      const last = messages[messages.length - 1];
      const user = users.find((u) => u.userId === targetId);

      if (!map.has(targetId)) {
        map.set(targetId, {
          userId: targetId,
          username: user?.username || targetId,
          lastMessage: last.message,
          lastMessageTime: last.timestamp,
          isOnline: user?.isOnline || false,
          unreadCount: 0,
        });
      } else {
        const existing = map.get(targetId)!;
        if (new Date(last.timestamp).getTime() > new Date(existing.lastMessageTime).getTime()) {
          existing.lastMessage = last.message;
          existing.lastMessageTime = last.timestamp;
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  },
};