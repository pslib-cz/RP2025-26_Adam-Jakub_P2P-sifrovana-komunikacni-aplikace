import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import { OnlineUsersList } from "../../components/dashboard/OnlineUsersList";
import { RecentChats } from "../../components/dashboard/RecentChats";
import { AllActiveUsers } from "../../components/dashboard/AllActiveUsers";

import { useAllUsers } from "../../hooks/useAllUsers";
import { chatService } from "../../services/chatService";

import type { UserData } from "../../types/userdata";
import type { Conversation } from "../../types/chat";

import AnimatedLogo from "../../components/ui/logo/AnimatedLogo";
import styles from "./DashboardPage.module.css";

function DashboardPage() {
  const navigate = useNavigate();
  const { user, updateLetsTalk } = useAuth();

  const {
    allUsers = [],
    onlineUsers = [],
    letsTalkUsers = [],
    loading = false,
  } = useAllUsers(user?.userId);

  const [toggleLoading, setToggleLoading] = useState(false);

  const letsTalkFiltered = useMemo(() => {
    if (!user?.userId) return [];

    return (letsTalkUsers ?? []).filter(
      (u) => u.userId !== user.userId
    );
  }, [letsTalkUsers, user?.userId]);

  const conversations = useMemo<Conversation[]>(() => {
    if (!user?.userId) return [];
    if (!allUsers?.length) return [];

    return chatService.buildConversations(
      user.userId,
      allUsers
    );
  }, [user?.userId, allUsers]);

  const handleUserClick = (u: UserData) => {
    if (u.userId === user?.userId) return;
    navigate(`/pages/ChatPage/${u.userId}`);
  };

  const handleConversationClick = (c: Conversation) => {
    navigate(`/pages/ChatPage/${c.userId}`);
  };

  const handleToggleLetsTalk = async () => {
    try {
      setToggleLoading(true);
      await updateLetsTalk();
    } finally {
      setToggleLoading(false);
    }
  };

  if (!user) return null;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <AnimatedLogo />
      </header>
      <div className={styles.content}>
  
        <OnlineUsersList
          users={letsTalkFiltered}
          currentUserId={user.userId}
          onUserClick={handleUserClick}
        />

        <RecentChats
          conversations={conversations}
          onConversationClick={handleConversationClick}
        />

        <AllActiveUsers
          users={allUsers}
          currentUserId={user.userId}
          onUserClick={handleUserClick}
          loading={loading}
        />
      </div>

      <footer className={styles.footer}>
        <label>
          <input className={styles.slider}
            type="checkbox"
            checked={user.letsTalk || false}
            onChange={handleToggleLetsTalk}
            disabled={toggleLoading}
          />
          LetsTalk
        </label>
      </footer>
    </main>
  );
}

export default DashboardPage;