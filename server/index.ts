import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";

import db from "./db";
import authRoutes from "./routes/authRoutes";
import messageRoutes from "./routes/messageRoutes";
import { handleConnection, getUsersWithStatus, onlineUsers } from "./ws/handlers";
import { ExtendedWebSocket } from "./types/ws.types";

import http from "http";
import path from "path";
import fs from "fs";

const app = express();
const server = http.createServer(app);

const PORT: number = Number(process.env.PORT) || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Unified server running on port ${PORT}`);
});

app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

db.initialize().catch((err: Error) => {
  console.error("Database initialization failed:", err);
  process.exit(1);
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

const frontendPath = path.join(process.cwd(), "../dist");
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health") {
      return next();
    }
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

const wss = new WebSocketServer({ server });
console.log(`Unified server running on port ${PORT}`);

wss.on("connection", (ws: ExtendedWebSocket) => {
  handleConnection(wss, ws);
});
setInterval(async () => {
  try {
    const users = await getUsersWithStatus();

    const online = users.filter((u: any) => u.isOnline);
    const letsTalk = users.filter((u: any) => u.isOnline && u.letsTalk);

    console.log("\n========== SERVER STATUS ==========");
    console.table(users);
    console.log(`🟢 Online: ${online.length}`);
    console.log(`💬 LetsTalk online: ${letsTalk.length}`);
    console.log("==================================\n");
  } catch (err) {
    console.error(err);
  }
}, 5000);

process.on("SIGINT", async () => {
  console.log("Shutting down...");

  await db.close();
  wss.close();

  process.exit(0);
});
