export interface User {
  id: string;
  userId: string;
  username: string;
  email: string;
  password: string;
  letsTalk?: boolean;
  bio?: string;
  profilePicture?: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface Message {
  type: "chat_message" | "connection_request";
  fromUserId: string;
  fromUsername: string;
  message?: string;
  offer?: RTCSessionDescriptionInit;
  timestamp: string;
}

export interface PendingMessage {
  type: "chat_message" | "connection_request";
  fromUserId: string;
  fromUsername: string;
  message?: string;
  offer?: RTCSessionDescriptionInit;
  timestamp: string;
}

export interface Conversation {
  userId: string;
  username: string;
  isOnline: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
}
