import React from "react";
import type { Conversation } from "../../services/chatService";
import styles from "./RecentChats.module.css";
import formatTime from "../../utils/formatTime";
interface RecentChatsProps {
  conversations: Conversation[];
  onConversationClick?: (conversation: Conversation) => void;
}

export const RecentChats: React.FC<RecentChatsProps> = ({
  conversations,
  onConversationClick,
}) => {
  if (!conversations.length) {
    return (
      <div className={styles.container}>
        <h3>Poslední zprávy</h3>
        <p className={styles.empty}>Zatím nemáte žádné konverzace</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3>Poslední zprávy</h3>

      <div className={styles.conversationsList}>
        {conversations.map((conversation) => {
          const timeLabel = formatTime(conversation.lastMessageTime);

          return (
            <button
              key={conversation.userId}
              className={styles.conversationItem}
              onClick={() => onConversationClick?.(conversation)}
            >
              <div className={styles.avatarContainer}>
                <img
                  src={conversation.profilePicture || "/pfp-default.png"}
                  alt={conversation.username}
                  className={styles.avatar}
                />

                {conversation.isOnline && (
                  <div className={styles.onlineDot} />
                )}
              </div>

              <div className={styles.conversationInfo}>
                <div className={styles.header}>
                  <h4 className={styles.username}>
                    {conversation.username}
                  </h4>

                  <span className={styles.time}>{timeLabel}</span>
                </div>

                <div className={styles.messageRow}>
                  {conversation.lastMessage && (
                    <p className={styles.lastMessage}>
                      {conversation.lastMessage}
                    </p>
                  )}
                  {!!conversation.unreadCount && conversation.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};