import React, { createContext, useContext, useEffect, useState } from "react";
import { socketClient } from "../services/socketClient";
import { useAuth } from "./AuthContext";
import type { UserData } from "../types/userdata";

type SocketContextType = {
  users: UserData[];
  connected: boolean;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user?.userId) return;
    socketClient.connect(user.userId);

    const handler = (data: any) => {
      setUsers(data.users);
      setConnected(true);
    };

    socketClient.on("user_list", handler);

    socketClient.send({ type: "get_users" });

    return () => {
      socketClient.off("user_list", handler);
    };
  }, [user?.userId]);

  return (
    <SocketContext.Provider value={{ users, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};
