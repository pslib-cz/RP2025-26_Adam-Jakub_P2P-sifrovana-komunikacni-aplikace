const API_BASE_URL = "http://localhost:3001/api";

export interface AuthUser {
  id: number;
  userId: string;
  username: string;
  email: string;
  isOnline: boolean;
}

class AuthClient {
  async register(userId: string, username: string, email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    return data.user as AuthUser;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    return data.user as AuthUser;
  }

  async logout(userId: string) {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Logout failed");
    }
  }

  async getAllUsers() {
    const response = await fetch(`${API_BASE_URL}/auth/users`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch users");
    }

    return data.users as AuthUser[];
  }

  async getUserById(userId: string) {
    const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch user");
    }

    return data.user as AuthUser;
  }

  async getUnreadMessages(userId: string) {
    const response = await fetch(`${API_BASE_URL}/auth/messages/${userId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch messages");
    }

    return data.messages;
  }
}

export const authClient = new AuthClient();
