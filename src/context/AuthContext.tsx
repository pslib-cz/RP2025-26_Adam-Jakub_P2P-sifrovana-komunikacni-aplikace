import React, { createContext, useContext, useState, useEffect } from "react";
import { authClient, type AuthUser } from "../services/authClient";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  register: (userId: string, username: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem("authUser");
      }
    }
    setLoading(false);
  }, []);

  const register = async (userId: string, username: string, email: string, password: string) => {
    try {
      setError(null);
      const newUser = await authClient.register(userId, username, email, password);
      setUser(newUser);
      localStorage.setItem("authUser", JSON.stringify(newUser));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const loggedInUser = await authClient.login(email, password);
      setUser(loggedInUser);
      localStorage.setItem("authUser", JSON.stringify(loggedInUser));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      if (user) {
        await authClient.logout(user.userId);
      }
      setUser(null);
      localStorage.removeItem("authUser");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
