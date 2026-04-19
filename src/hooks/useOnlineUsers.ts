import { useSocket } from "../context/SocketContext";

export const useOnlineUsers = () => {
  const { users, connected } = useSocket();

  return {
    onlineUsers: users.filter((u) => u.isOnline),
    connected,
  };
};