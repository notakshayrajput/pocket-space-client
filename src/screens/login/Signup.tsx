import { useState } from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import BrandLogo from "../../components/icons/BrandLogo";
import "./Login.css";

export default function Signup() {
  const { user, loading, signup } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (user) return <Navigate to="/files" replace />;

  const submit = async ({ username, password }: { username: string; password: string }) => {
    setSubmitting(true);
    setError(null);
    try { await signup(username, password); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not create your account."); }
    finally { setSubmitting(false); }
  };

  return <main className="login-page"><Card className="login-card">
    <div className="login-brand"><BrandLogo style={{ fontSize: 40 }} /><span>Pocket Space</span></div>
    <Typography.Title level={2}>Your own space</Typography.Title>
    <Typography.Paragraph type="secondary">Create an account and start using your private folder immediately.</Typography.Paragraph>
    <Alert className="login-alert" type="info" showIcon message="Admin approval is required"
      description="You can upload, download, and manage files while you wait. If your account is not approved within 7 days of signup, your account and all its files will be permanently deleted." />
    {error && <Alert className="login-alert" type="error" showIcon message={error} role="alert" />}
    <Form layout="vertical" onFinish={submit} requiredMark={false} disabled={submitting || loading}>
      <Form.Item label="Username" name="username" rules={[
        { required: true, message: "Choose a username." },
        { pattern: /^[a-zA-Z0-9_.-]{3,64}$/, message: "Use 3–64 letters, numbers, dots, hyphens, or underscores." },
      ]}><Input autoComplete="username" maxLength={64} size="large" /></Form.Item>
      <Form.Item label="Password" name="password" extra="At least 8 characters, including a lowercase letter, number, and symbol."
        rules={[{ required: true, message: "Choose a password." }, { min: 8, message: "Use at least 8 characters." }]}>
        <Input.Password autoComplete="new-password" maxLength={1024} size="large" />
      </Form.Item>
      <Form.Item label="Confirm password" name="confirmPassword" dependencies={["password"]} rules={[
        { required: true, message: "Confirm your password." },
        ({ getFieldValue }) => ({ validator: (_, value) => !value || getFieldValue("password") === value
          ? Promise.resolve() : Promise.reject(new Error("Passwords do not match.")) }),
      ]}><Input.Password autoComplete="new-password" size="large" /></Form.Item>
      <Button type="primary" htmlType="submit" size="large" block loading={submitting || loading}>Create account</Button>
    </Form>
    <Typography.Paragraph style={{ marginTop: 20, marginBottom: 0 }}>Already registered? <Link to="/login">Sign in</Link></Typography.Paragraph>
  </Card></main>;
}
