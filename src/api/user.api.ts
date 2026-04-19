import { request } from "./http";
import type { AuthUser } from "./auth.api";

export const userApi = {
  getAll: () =>
    request<{ users: AuthUser[] }>("/auth/users").then(r => r.users),

  getById: (userId: string) =>
    request<{ user: AuthUser }>(`/auth/user/${userId}`).then(r => r.user),

  toggleLetsTalk: (userId: string) =>
    request<{ user: AuthUser }>("/auth/toggle-letstalk", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }).then(r => r.user),
};