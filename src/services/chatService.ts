// src/services/chatService.ts

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

  buildConversations(userId: string, users: any[]): Conversation[] {
    const conversations: Conversation[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(`chat_${userId}_`)) continue;

      const targetId = key.split("_")[2];
      const messages = JSON.parse(localStorage.getItem(key) || "[]");
      if (!messages.length) continue;

      const last = messages[messages.length - 1];
      const user = users.find((u) => u.userId === targetId);

      conversations.push({
        userId: targetId,
        username: user?.username || targetId,
        lastMessage: last.message,
        lastMessageTime: last.timestamp,
        isOnline: user?.isOnline || false,
      });
    }

    return conversations.sort(
      (a, b) =>
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime()
    );
  },
};