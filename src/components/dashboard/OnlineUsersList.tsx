import React from "react";
import type { UserData } from "../../types/userdata";
import styles from "./OnlineUsersList.module.css";

interface OnlineUsersListProps {
  users: UserData[];
  currentUserId?: string;
  onUserClick?: (user: UserData) => void;
}

export const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  users,
  currentUserId,
  onUserClick,
}) => {
  const filteredUsers = users.filter(
    (user) => user.userId !== currentUserId
  );

  const handleScroll = (direction: "left" | "right") => {
    const container = document.getElementById("online-users-scroll");

    if (!container) return;

    const scrollAmount = 200;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (filteredUsers.length === 0) {
    return (
      <div className={styles.container}>
        <h3>LetsTalk!</h3>
        <p className={styles.empty}>
          Žádní online uživatelé nejsou dostupni
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3>LetsTalk!</h3>

      <div className={styles.scrollContainer}>
        <button
          className={`${styles.scrollButton} ${styles.leftButton}`}
          onClick={() => handleScroll("left")}
        >
          ‹
        </button>

        <div id="online-users-scroll" className={styles.usersList}>
          {filteredUsers.map((user) => (
            <button
              key={user.userId}
              className={styles.userCard}
              onClick={() => onUserClick?.(user)}
              title={user.username}
            >
              <div className={styles.avatarContainer}>
                <img
                  src={user.profilePicture || "/pfp-default.png"}
                  className={styles.avatar}
                />
                <div className={styles.onlineDot} />
              </div>

              <span className={styles.username}>
                {user.username}
              </span>
            </button>
          ))}
        </div>

        <button
          className={`${styles.scrollButton} ${styles.rightButton}`}
          onClick={() => handleScroll("right")}
        >
          ›
        </button>
      </div>
    </div>
  );
};