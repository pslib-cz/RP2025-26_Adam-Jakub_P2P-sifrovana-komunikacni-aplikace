const bcrypt = require("bcryptjs");
const db = require("./db");

const DEFAULT_PFP = "/pfp-default.png";

class AuthService {
  async register(userId, username, email, password) {
    const existing = await db.get(
      `SELECT id, userId, email, username 
       FROM users 
       WHERE userId = ? OR email = ? OR username = ?`,
      [userId, email, username]
    );

    if (existing) {
      let field = "unknown";

      if (existing.userId === userId) field = "userId";
      else if (existing.email === email) field = "email";
      else if (existing.username === username) field = "username";

      throw new Error(`User with this ${field} already exists`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      `INSERT INTO users 
        (userId, username, email, password, isOnline, letsTalk, profilePicture, lastSeen)
       VALUES (?, ?, ?, ?, 1, 1, ?, CURRENT_TIMESTAMP)`,
      [userId, username, email, hashedPassword, DEFAULT_PFP]
    );

    return {
      id: result.id,
      userId,
      username,
      email,
      isOnline: true,
      letsTalk: true,
      profilePicture: DEFAULT_PFP,
    };
  }

  async login(email, password) {
    const user = await db.get(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("Invalid password");

    await db.run(
      `UPDATE users 
       SET isOnline = 1, lastSeen = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [user.id]
    );

    return {
      id: user.id,
      userId: user.userId,
      username: user.username,
      email: user.email,
      isOnline: true,
      letsTalk: user.letsTalk,
      profilePicture: user.profilePicture || DEFAULT_PFP,
    };
  }

  async logout(userId) {
    await db.run(
      `UPDATE users 
       SET isOnline = 0, lastSeen = CURRENT_TIMESTAMP 
       WHERE userId = ?`,
      [userId]
    );
  }

  async getUserById(userId) {
    return db.get(
      `SELECT id, userId, username, email, letsTalk, profilePicture, bio, isOnline, lastSeen 
       FROM users 
       WHERE userId = ?`,
      [userId]
    );
  }

  async getAllUsers() {
    return db.all(
      `SELECT id, userId, username, email, letsTalk, profilePicture, bio, isOnline, lastSeen 
       FROM users 
       ORDER BY isOnline DESC, lastSeen DESC`
    );
  }

  async toggleLetsTalk(userId) {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");

    const newStatus = user.letsTalk ? 0 : 1;

    await db.run(
      "UPDATE users SET letsTalk = ? WHERE userId = ?",
      [newStatus, userId]
    );

    return this.getUserById(userId);
  }

  async updateProfilePicture(userId, url) {
    await db.run(
      "UPDATE users SET profilePicture = ? WHERE userId = ?",
      [url, userId]
    );

    return this.getUserById(userId);
  }
}

module.exports = new AuthService();