import { useMemo } from "react";
import { useSocket } from "../context/SocketContext";
import type { UserData } from "../types/userdata";

export const useAllUsers = (_userId?: string) => {
  const { users: allUsers, connected } = useSocket();

  const onlineUsers = useMemo(
    () => allUsers.filter((u: UserData) => u.isOnline),
    [allUsers]
  );

  const letsTalkUsers = useMemo(
    () => allUsers.filter((u: UserData) => u.isOnline && u.letsTalk),
    [allUsers]
  );

  const offlineUsers = useMemo(
    () => allUsers.filter((u: UserData) => !u.isOnline),
    [allUsers]
  );

  return {
    allUsers,
    onlineUsers,
    letsTalkUsers,
    offlineUsers,
    loading: !connected && allUsers.length === 0,
  };
};