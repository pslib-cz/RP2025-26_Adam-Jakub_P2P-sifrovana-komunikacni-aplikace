import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

import path from "path";
import fs from "fs";

const DATA_DIR = "/data";
const DB_NAME = "database.sqlite";
const DB_PATH = fs.existsSync(DATA_DIR) 
  ? path.join(DATA_DIR, DB_NAME) 
  : path.join(process.cwd(), DB_NAME);

const sqlite = new Database(DB_PATH);

sqlite.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  PRAGMA temp_store = MEMORY;
`);

export const db = drizzle(sqlite, { schema });

export { schema };

function ensureSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      userId         TEXT NOT NULL UNIQUE,
      username       TEXT NOT NULL UNIQUE,
      email          TEXT NOT NULL UNIQUE,
      password       TEXT NOT NULL,
      isOnline       INTEGER NOT NULL DEFAULT 0,
      letsTalk       INTEGER NOT NULL DEFAULT 1,
      profilePicture TEXT,
      lastSeen       TEXT
    );

    DROP TABLE IF EXISTS messages;

    CREATE TABLE IF NOT EXISTS messages (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      senderId       TEXT NOT NULL,
      receiverId     TEXT NOT NULL,
      content        TEXT NOT NULL,
      timestamp      TEXT NOT NULL,
      isRead         INTEGER NOT NULL DEFAULT 0
    );
  `);
}
export async function initializeDatabase() {
  try {
    ensureSchema();
    console.log("🟢 SQLite connected (Drizzle ready)");
  } catch (err) {
    console.error("❌ DB initialization error:", err);
    process.exit(1);
  }
}
export async function closeDatabase() {
  try {
    sqlite.close();
    console.log("🔴 SQLite connection closed");
  } catch (err) {
    console.error("❌ Error closing DB:", err);
  }
}

export default {
  db,
  initialize: initializeDatabase,
  close: closeDatabase,
};
