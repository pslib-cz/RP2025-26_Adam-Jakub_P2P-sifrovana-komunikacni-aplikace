import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("userId").notNull().unique(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isOnline: integer("isOnline").notNull().default(0),
  letsTalk: integer("letsTalk").notNull().default(1),
  profilePicture: text("profilePicture"),
  lastSeen: text("lastSeen"),
});

export type User = {
  id: number;
  userId: string;
  username: string;
  email: string;
  isOnline: number;
  letsTalk: number;
  profilePicture?: string;
  lastSeen?: string;
};
export type NewUser = typeof users.$inferInsert;

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  senderId: text("senderId").notNull(),
  receiverId: text("receiverId").notNull(),
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
  isRead: integer("isRead").notNull().default(0),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
