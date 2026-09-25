import { Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import Login from "./screens/login/Login";
import Signup from "./screens/login/Signup";
import PendingUsers from "./screens/admin/PendingUsers";
import ForgotPassword from "./screens/login/ForgotPassword";
import PasswordResetRequests from "./screens/admin/PasswordResetRequests";
import Settings from "./screens/settings/Settings";
import "./App.css";
import Home from "./screens/home/Home";
import FilesScreen from "./screens/files-screen/FilesScreen";


function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/files" element={<FilesScreen />} />
          <Route path="/admin/users" element={<PendingUsers />} />
          <Route path="/admin/password-resets" element={<PasswordResetRequests />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
