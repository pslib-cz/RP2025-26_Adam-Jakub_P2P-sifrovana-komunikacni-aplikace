import { useState, useEffect, useRef } from "react";
import type { UserData } from "../types/userdata";

const WS_URL = "ws://localhost:3000";

export const useAllUsers = (userId?: string) => {
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setLoading(false);

      ws.send(
        JSON.stringify({
          type: "online",
          userId,
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "user_list") {
        setAllUsers(Array.isArray(data.users) ? data.users : []);
      }
    };

    ws.onerror = () => setLoading(false);

  }, [userId]);

  const onlineUsers = allUsers.filter((u) => u.isOnline);
  const letsTalkUsers = allUsers.filter(
    (u) => u.isOnline && u.letsTalk
  );
  const offlineUsers = allUsers.filter((u) => !u.isOnline);

  return {
    allUsers,
    onlineUsers,
    letsTalkUsers,
    offlineUsers,
    loading,
  };
};