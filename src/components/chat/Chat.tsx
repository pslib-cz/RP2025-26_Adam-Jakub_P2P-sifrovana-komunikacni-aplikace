import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../../hooks/useChat";
import styles from "./Chat.module.css";

interface ChatProps {
  currentUserId: string;
  targetUserId: string;
  targetUsername: string;
  onClose?: () => void;
}

export const Chat: React.FC<ChatProps> = ({
  currentUserId,
  targetUserId,
  targetUsername,
  onClose,
}) => {
  const { messages, connected, loading, sendMessage } = useChat(
    currentUserId,
    targetUserId
  );

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    sendMessage(inputValue);
    setInputValue("");
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.chatContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.userInfo}>
            <h2>{targetUsername}</h2>
            <span
              className={`${styles.status} ${connected ? styles.online : styles.offline
                }`}
            >
              {connected ? "🟢 P2P připojeno" : "⚫ fallback režim"}
            </span>
          </div>

          {onClose && (
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Zavřít chat"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      <div className={styles.messagesContainer}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <p>Načítám chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p>Zatím žádné zprávy</p>
            <p className={styles.subtitle}>
              Napiš první zprávu
            </p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageItem} ${msg.isOwn ? styles.own : styles.other
                  }`}
              >
                <div className={styles.messageBubble}>
                  <p className={styles.messageText}>{msg.message}</p>
                  <span className={styles.timestamp}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* INPUT */}
      <footer className={styles.footer}>
        <form className={styles.inputForm} onSubmit={handleSendMessage}>
          <input
            type="text"
            className={styles.messageInput}
            placeholder={
              connected
                ? "Napište zprávu..."
                : "Offline zpráva (odešle se přes server)"
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className={styles.sendButton}
            disabled={!inputValue.trim()}
            title={connected ? "Odeslat (P2P)" : "Odeslat (fallback)"}
          >
            ➤
          </button>
        </form>
      </footer>
    </div>
  );
};

export default Chat;