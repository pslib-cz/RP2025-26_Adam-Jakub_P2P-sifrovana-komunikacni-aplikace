const bcrypt = require("bcryptjs");
const db = require("./db");

class AuthService {
  async register(userId, username, email, password) {
    // check usera
    const existing = await db.get(
      "SELECT id FROM users WHERE userId = ? OR email = ? OR username = ?",
      [userId, email, username]
    );

    if (existing) {
      const field = existing.userId === userId ? "userId" : existing.email === email ? "email" : "username";
      throw new Error(`User with this ${field} already exists`);
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const result = await db.run(
      `INSERT INTO users (userId, username, email, password, isOnline, lastSeen)
       VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [userId, username, email, hashedPassword]
    );

    return {
      id: result.id,
      userId,
      username,
      email,
      isOnline: true,
    };
  }

  async login(email, password) {
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);

    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    await db.run("UPDATE users SET isOnline = 1, lastSeen = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);

    return {
      id: user.id,
      userId: user.userId,
      username: user.username,
      email: user.email,
      isOnline: true,
    };
  }

  async logout(userId) {
    await db.run("UPDATE users SET isOnline = 0, lastSeen = CURRENT_TIMESTAMP WHERE userId = ?", [userId]);
  }

  async getUserById(userId) {
    return db.get("SELECT id, userId, username, email, isOnline, lastSeen FROM users WHERE userId = ?", [userId]);
  }

  async getAllUsers() {
    return db.all("SELECT id, userId, username, email, isOnline, lastSeen FROM users ORDER BY isOnline DESC, lastSeen DESC");
  }

  async getUnreadMessages(userId) {
    return db.all(
      `SELECT m.*, u.username as fromUsername FROM messages m
       JOIN users u ON m.fromUserId = u.userId
       WHERE m.toUserId = ? AND m.isRead = 0
       ORDER BY m.createdAt DESC`,
      [userId]
    );
  }

  async saveMessage(fromUserId, toUserId, message, type = "chat") {
    return db.run(
      `INSERT INTO messages (fromUserId, toUserId, message, type)
       VALUES (?, ?, ?, ?)`,
      [fromUserId, toUserId, message, type]
    );
  }

  async markMessageAsRead(messageId) {
    return db.run("UPDATE messages SET isRead = 1 WHERE id = ?", [messageId]);
  }
}

module.exports = new AuthService();
