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