import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";

import db from "./db";
import authRoutes from "./routes/authRoutes";
import messageRoutes from "./routes/messageRoutes";
import { handleConnection, getUsersWithStatus, onlineUsers } from "./ws/handlers";
import { ExtendedWebSocket } from "./types/ws.types";

const app = express();

const PORT: number = 3001;
const WS_PORT: number = 3000;

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

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});
app.listen(PORT, () => {
  console.log(`API server http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`WS server ws://localhost:${WS_PORT}`);

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
