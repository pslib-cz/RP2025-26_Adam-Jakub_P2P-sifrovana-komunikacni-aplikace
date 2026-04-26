import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAllUsers } from "../../hooks/useAllUsers";
import Chat from "../../components/chat/Chat";

import styles from "./ChatPage.module.css";

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allUsers } = useAllUsers(user?.userId);

  if (!user || !id) return null;

  if (id === user.userId) {
    return (
      <div className={styles.container}>
        <p>Nemůžeš chatovat sám se sebou</p>
      </div>
    );
  }

  const target = allUsers.find((u) => u.userId === id);

  return (
    <Chat
      currentUserId={user.userId}
      targetUserId={id}
      targetUsername={target?.username || "Unknown"}
      onClose={() => navigate("/dashboard")}
    />
  );
}