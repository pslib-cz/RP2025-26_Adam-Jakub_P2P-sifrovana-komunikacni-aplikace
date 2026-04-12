import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/router/ProtectedRoute";
import LoginPage from "./pages/login/LoginPage";
import RegisterPage from "./pages/register/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ChatPage from "./pages/chat/ChatPage";
import HomePage from "./pages/home/HomePage";

function App() {
  return (
    <AuthProvider>
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
          path="/pages/ChatPage/:id"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/pages/HomePage" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
