import { useState } from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import BrandLogo from "../../components/icons/BrandLogo";
import "./Login.css";

export default function Login() {
  const { user, loading, error: connectionError, login, retry, logout } = useAuth();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const from: unknown = location.state?.from;
  const destination = typeof from === "string" && from.startsWith("/") && !from.startsWith("//") &&
    from.split("?")[0] !== "/login" ? from : "/";

  if (user) return <Navigate to={destination} replace />;

  const handleLogin = async ({ username, password }: { username: string; password: string }) => {
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <Card className="login-card">
        <div className="login-brand"><BrandLogo style={{ fontSize: 40 }} /><span>Pocket Space</span></div>
        <Typography.Title level={2}>Welcome back</Typography.Title>
        <Typography.Paragraph type="secondary">Sign in to access your files and folders.</Typography.Paragraph>
        {location.state?.passwordChanged && <Alert className="login-alert" type="success" showIcon message="Password changed. Sign in with your new password." role="status" />}
        {error && <Alert className="login-alert" type="error" showIcon message={error} role="alert" />}
        {connectionError && <Alert className="login-alert" type="warning" showIcon message={connectionError}
          action={<Button size="small" onClick={retry}>Retry</Button>} />}
        <Form layout="vertical" onFinish={handleLogin} requiredMark={false} disabled={submitting || loading}>
          <Form.Item label="Username" name="username" rules={[{ required: true, whitespace: true, message: "Enter your username." }]}>
            <Input prefix={<UserOutlined />} autoComplete="username" autoFocus maxLength={256} size="large" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, message: "Enter your password." }]}>
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" maxLength={1024} size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={submitting || loading}>Sign in</Button>
        </Form>
        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0 }}><Link to="/forgot-password">Forgot password?</Link></Typography.Paragraph>
        <Typography.Paragraph style={{ marginTop: 20, marginBottom: 0 }}>
          New to PocketSpace? <Link to="/signup">Create an account</Link>
        </Typography.Paragraph>
        {connectionError && <Button type="link" onClick={logout}>Clear saved login</Button>}
      </Card>
    </main>
  );
}
