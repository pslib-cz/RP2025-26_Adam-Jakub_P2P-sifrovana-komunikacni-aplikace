import { WebSocketServer } from "ws";
import authService from "../services/authService";
import { OnlineUserMap, ExtendedWebSocket } from "../types/ws.types";
import { User } from "../db/schema";
import messageService from "../services/messageService";

export const onlineUsers: OnlineUserMap = new Map();
let globalWss: WebSocketServer | null = null;

export async function getUsersWithStatus() {
    const users = await authService.getAllUsers();

    return users.map((u: any) => ({
        userId: u.userId,
        username: u.username,
        letsTalk: Boolean(u.letsTalk),
        isOnline: onlineUsers.has(u.userId),
        profilePicture: u.profilePicture,
    }));
}

export async function broadcastUsers(wss?: WebSocketServer) {
    const server = wss || globalWss;
    if (!server) return;

    const users = await getUsersWithStatus();

    const payload = JSON.stringify({
        type: "user_list",
        users,
    });

    server.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(payload);
        }
    });
}

export function handleConnection(wss: WebSocketServer, ws: ExtendedWebSocket) {
    if (!globalWss) globalWss = wss;
    console.log("Client connected");

    ws.on("message", async (raw: any) => {
        try {
            const data = JSON.parse(raw.toString());

            if (data.type === "online") {
                ws.userId = data.userId;
                onlineUsers.set(data.userId, ws);
                await broadcastUsers(wss);
            }

            if (data.type === "get_users") {
                const users = await getUsersWithStatus();

                if (ws.readyState === 1) {
                    ws.send(JSON.stringify({ type: "user_list", users }));
                }
            }

            if (data.type === "signal") {
                const targetWs = onlineUsers.get(data.targetUserId);
                if (!targetWs) return;

                targetWs.send(
                    JSON.stringify({
                        type: "signal",
                        fromUserId: data.fromUserId || ws.userId,
                        signal: data.signal,
                    })
                );
            }

            if (data.type === "ice_candidate") {
                const targetWs = onlineUsers.get(data.targetUserId);
                if (!targetWs) return;

                targetWs.send(
                    JSON.stringify({
                        type: "ice_candidate",
                        fromUserId: data.fromUserId || ws.userId,
                        candidate: data.candidate,
                    })
                );
            }

            if (data.type === "chat_message") {
                const senderId = data.fromUserId || ws.userId;
                const receiverId = data.targetUserId;
                const savedMsg = await messageService.saveMessage(senderId, receiverId, data.message);

                const targetWs = onlineUsers.get(receiverId);
                if (targetWs && targetWs.readyState === 1) {
                    const sender = await authService.getUserById(senderId);

                    targetWs.send(
                        JSON.stringify({
                            type: "chat_message",
                            fromUserId: senderId,
                            fromUsername: sender ? sender.username : "Unknown",
                            message: savedMsg.content,
                            timestamp: savedMsg.timestamp,
                        })
                    );
                }
            }
        } catch (err) {
            console.error("WS error:", err);
        }
    });

    ws.on("close", async () => {
        if (!ws.userId) return;

        onlineUsers.delete(ws.userId);
        await authService.logout(ws.userId);
        await broadcastUsers(wss);
    });

    ws.on("error", (err: Error) => {
        console.error("WS error:", err);
    });
}
