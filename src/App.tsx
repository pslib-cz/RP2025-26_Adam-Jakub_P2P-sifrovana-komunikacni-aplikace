import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

import { ProtectedRoute } from "./components/router/ProtectedRoute";

import LoginPage from "./pages/login/LoginPage";
import RegisterPage from "./pages/register/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ChatPage from "./pages/chat/ChatPage";
import HomePage from "./pages/home/HomePage";
import ProfilePage from "./pages/profile/ProfilePage";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/pages/HomePage" element={<HomePage />} />
          <Route path="/pages/LoginPage" element={<LoginPage />} />
          <Route path="/pages/RegisterPage" element={<RegisterPage />} />

          <Route
            path="/pages/DashboardPage"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pages/ProfilePage"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pages/ChatPage/:id"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/pages/HomePage" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;