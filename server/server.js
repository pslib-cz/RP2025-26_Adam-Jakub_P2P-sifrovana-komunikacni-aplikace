const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const db = require("./db");
const authRoutes = require("./authRoutes");

const app = express();
const PORT = 3001;
const WS_PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

db.initialize().catch((err) => {
  console.error("Database initialization failed:", err);
  process.exit(1);
});

app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`API server bezi na http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ port: WS_PORT });
const users = {};

console.log(`WebSocket signaling server bezi na ws://localhost:${WS_PORT}`);

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case "online": {
          const { userId } = data;
          ws.userId = userId;
          users[userId] = { socket: ws, isOnline: true };
          console.log(`User ${userId} je online`);

          broadcastUserStatus();

          const authService = require("./authService");
          const unreadMessages = await authService.getUnreadMessages(userId);
          if (unreadMessages.length > 0) {
            ws.send(
              JSON.stringify({
                type: "unread_messages",
                messages: unreadMessages,
              })
            );
          }

          break;
        }

        case "request_connection": {
          const { targetUserId, offer, fromUserId } = data;
          const targetUser = users[targetUserId];
          console.log(`Zadost pro spojeni od ${fromUserId} pro ${targetUserId}`);

          if (targetUser && targetUser.socket.readyState === WebSocket.OPEN) {
            targetUser.socket.send(
              JSON.stringify({
                type: "connection_request",
                fromUserId: fromUserId || ws.userId,
                offer,
              })
            );
          } else {
            console.log(`User ${targetUserId} neni online`);
          }
          break;
        }


        case "signal": {
          const { targetUserId, signal, fromUserId } = data;
          const targetUser = users[targetUserId];

          console.log(`Signal od ${fromUserId || ws.userId} pro ${targetUserId}: ${signal.type}`);

          if (targetUser && targetUser.socket.readyState === WebSocket.OPEN) {
            targetUser.socket.send(
              JSON.stringify({
                type: "signal",
                fromUserId: fromUserId || ws.userId,
                signal,
              })
            );
          } else {
            console.log(`Nelze odeslat signal: target ${targetUserId} neni online`);
          }
          break;
        }

        case "chat_message": {
          const { targetUserId, message, fromUserId } = data;
          const actualFromUserId = fromUserId || ws.userId;
          const authService = require("./authService");

          console.log(`Zprava od ${actualFromUserId} pro ${targetUserId}`);


          await authService.saveMessage(actualFromUserId, targetUserId, message);

          const targetUser = users[targetUserId];
          if (targetUser && targetUser.socket.readyState === WebSocket.OPEN) {
            const sender = await authService.getUserById(actualFromUserId);
            targetUser.socket.send(
              JSON.stringify({
                type: "chat_message",
                fromUserId: actualFromUserId,
                fromUsername: sender.username,
                message,
                timestamp: new Date().toISOString(),
              })
            );
          }
          break;
        }
      }
    } catch (err) {
      console.error("WebSocket message error:", err);
    }
  });

  ws.on("close", () => {
    const authService = require("./authService");

    for (const [userId, userData] of Object.entries(users)) {
      if (userData.socket === ws) {
        users[userId].isOnline = false;
        console.log(`User ${userId} odpojen`);

        authService.logout(userId);

        broadcastUserStatus();
        break;
      }
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

function broadcastUserStatus() {
  const authService = require("./authService");

  authService.getAllUsers().then((users) => {
    const onlineUsers = users.filter((u) => u.isOnline);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "user_list",
            users: onlineUsers,
          })
        );
      }
    });
  });
}

process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  await db.close();
  wss.close();
  process.exit(0);
});
