import React, { createContext, useContext, useEffect, useState } from "react";
import { socketClient } from "../services/socketClient";
import type { UserData } from "../types/userdata";

type SocketContextType = {
  users: UserData[];
  connected: boolean;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({
  userId,
  children,
}: {
  userId?: string;
  children: React.ReactNode;
}) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    socketClient.connect(userId);

    const handler = (data: any) => {
      setUsers(data.users);
      setConnected(true);
    };

    socketClient.on("user_list", handler);

    return () => {
      socketClient.off("user_list", handler);
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ users, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used in provider");
  return ctx;
};