import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div>
        <p >Načítám...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/pages/LoginPage" replace />;
  }

  return <>{children}</>;
};
