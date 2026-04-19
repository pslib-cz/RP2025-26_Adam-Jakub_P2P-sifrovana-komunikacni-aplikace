import React, { createContext, useContext, useEffect, useState } from "react";
import { client } from "../api/client";
import type { AuthUser } from "../api/auth.api";
import { storage } from "../utils/storage";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  register: (u: string, n: string, e: string, p: string) => Promise<void>;
  login: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  updateLetsTalk: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(storage.get("authUser"));
    setLoading(false);
  }, []);

  const withError = async (fn: () => Promise<any>) => {
    try {
      setError(null);
      return await fn();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error";
      setError(message);
      throw err;
    }
  };

  const register = (userId: string, username: string, email: string, password: string) =>
    withError(async () => {
      const newUser = await client.auth.register(userId, username, email, password);
      setUser(newUser);
      storage.set("authUser", newUser);
    });

  const login = (email: string, password: string) =>
    withError(async () => {
      const loggedUser = await client.auth.login(email, password);
      setUser(loggedUser);
      storage.set("authUser", loggedUser);
    });

  const logout = () =>
    withError(async () => {
      if (user) await client.auth.logout(user.userId);
      setUser(null);
      storage.remove("authUser");
    });

  const updateLetsTalk = () =>
    withError(async () => {
      if (!user) throw new Error("No user");

      const updated = await client.user.toggleLetsTalk(user.userId);
      setUser(updated);
      storage.set("authUser", updated);
    });

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        updateLetsTalk,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};