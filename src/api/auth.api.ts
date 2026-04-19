import { request } from "./http";

export interface AuthUser {
  id: number;
  userId: string;
  username: string;
  email: string;
  isOnline: boolean;
  letsTalk?: boolean;
}

export const authApi = {
  register: (userId: string, username: string, email: string, password: string) =>
    request<{ user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ userId, username, email, password }),
    }).then(r => r.user),

  login: (email: string, password: string) =>
    request<{ user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then(r => r.user),

  logout: (userId: string) =>
    request<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
};