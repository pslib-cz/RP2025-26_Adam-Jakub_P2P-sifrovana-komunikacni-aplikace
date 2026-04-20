import React from "react";
import type { UserData } from "../../types/userdata";
import styles from "./AllActiveUsers.module.css";

interface Props {
  users: UserData[];
  currentUserId: string;
  onUserClick?: (user: UserData) => void;
  loading?: boolean;
}

export const AllActiveUsers: React.FC<Props> = ({
  users,
  currentUserId,
  onUserClick,
  loading = false,
}) => {
  const filteredUsers = users.filter(
    (u) => u.userId !== currentUserId
  );

  if (loading) {
    return <p className={styles.empty}>Načítám uživatele...</p>;
  }

  if (filteredUsers.length === 0) {
    return (
      <p className={styles.empty}>
        Žádní uživatelé nejsou k dispozici
      </p>
    );
  }

  return (
    <div className={styles.container}>
      <h3>Všichni uživatelé</h3>

      <div className={styles.usersList}>
        {filteredUsers.map((user) => (
          <div
            key={user.userId}
            className={`${styles.userCard} ${
              user.isOnline ? styles.online : styles.offline
            }`}
          >
            <img
              src={user.profilePicture || "/pfp-default.png"}
              className={styles.avatar}
            />

            <div className={styles.userInfo}>
              <h4>{user.username}</h4>
              <p>{user.isOnline ? "🟢 Online" : "⚫ Offline"}</p>
            </div>

            <button
              onClick={() => onUserClick?.(user)}
              className={styles.chatButton}
            >
              Chatovat
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};