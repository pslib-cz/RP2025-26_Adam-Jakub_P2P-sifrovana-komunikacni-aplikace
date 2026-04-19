const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const WebSocket = require("ws");

const db = require("./db");
const authRoutes = require("./authRoutes");
const authService = require("./authService");

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
  res.json({ status: "ok" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

app.listen(PORT, () => {
  console.log(`API server http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ port: WS_PORT });

const onlineUsers = new Map();

console.log(`WS server ws://localhost:${WS_PORT}`);

async function getUsersWithStatus() {
  const users = await authService.getAllUsers();

  return users.map((u) => ({
    userId: u.userId,
    username: u.username,
    letsTalk: u.letsTalk || false,
    isOnline: onlineUsers.has(u.userId),
  }));
}

async function broadcastUsers() {
  const users = await getUsersWithStatus();

  const payload = JSON.stringify({
    type: "user_list",
    users,
  });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

setInterval(async () => {
  try {
    const users = await getUsersWithStatus();

    const online = users.filter((u) => u.isOnline);
    const letsTalk = users.filter((u) => u.isOnline && u.letsTalk);

    console.log("\n========== SERVER STATUS ==========");
    console.table(users);
    console.log(`🟢 Online: ${online.length}`);
    console.log(`💬 LetsTalk online: ${letsTalk.length}`);
    console.log("==================================\n");
  } catch (err) {
    console.error(err);
  }
}, 5000);

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (raw) => {
    try {
      const data = JSON.parse(raw);

      if (data.type === "online") {
        ws.userId = data.userId;
        onlineUsers.set(data.userId, ws);
        await broadcastUsers();
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
        const targetWs = onlineUsers.get(data.targetUserId);
        if (!targetWs) return;

        const sender = await authService.getUserById(
          data.fromUserId || ws.userId
        );

        targetWs.send(
          JSON.stringify({
            type: "chat_message",
            fromUserId: data.fromUserId || ws.userId,
            fromUsername: sender.username,
            message: data.message,
            timestamp: new Date().toISOString(),
          })
        );
      }
    } catch (err) {
      console.error("WS error:", err);
    }
  });

  ws.on("close", async () => {
    if (!ws.userId) return;

    onlineUsers.delete(ws.userId);
    await authService.logout(ws.userId);
    await broadcastUsers();
  });

  ws.on("error", (err) => {
    console.error("WS error:", err);
  });
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");

  await db.close();
  wss.close();

  process.exit(0);
});