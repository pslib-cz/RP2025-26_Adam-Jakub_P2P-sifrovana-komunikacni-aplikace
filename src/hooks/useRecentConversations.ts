import { useSocket } from "../context/SocketContext";

export const useRecentConnections = () => {
  const { users } = useSocket();

  return users
    .filter((u) => u.lastSeen)
    .sort(
      (a, b) =>
        new Date(b.lastSeen!).getTime() -
        new Date(a.lastSeen!).getTime()
    )
    .slice(0, 10);
};