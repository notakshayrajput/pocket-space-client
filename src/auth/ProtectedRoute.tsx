import { Button, Flex, Result, Spin } from "antd";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth-context";

export default function ProtectedRoute() {
  const { user, loading, error, retry, logout } = useAuth();
  const location = useLocation();
  if (loading) return <Flex justify="center" align="center" style={{ minHeight: "100vh" }}><Spin size="large" aria-label="Checking login" /></Flex>;
  if (error) return <Result status="warning" title="Server unavailable" subTitle={error}
    extra={[<Button key="retry" type="primary" onClick={retry}>Try again</Button>, <Button key="logout" onClick={logout}>Back to login</Button>]} />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}
