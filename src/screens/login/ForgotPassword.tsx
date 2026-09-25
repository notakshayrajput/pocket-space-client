import { useState } from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { Link } from "react-router-dom";
import BrandLogo from "../../components/icons/BrandLogo";
import HttpService from "../../services/http-service";
import "./Login.css";

export default function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submit = async ({ username }: { username: string }) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await HttpService.getInstance().post<{ message: string }>("/auth/password-reset-request", { username });
      setSuccess(result.message);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not request a password reset."); }
    finally { setSubmitting(false); }
  };

  return <main className="login-page"><Card className="login-card">
    <div className="login-brand"><BrandLogo style={{ fontSize: 40 }} /><span>Pocket Space</span></div>
    <Typography.Title level={2}>Forgot password?</Typography.Title>
    <Typography.Paragraph type="secondary">Enter your username to ask an administrator to reset your password. They will set a new password and share it with you directly.</Typography.Paragraph>
    {error && <Alert className="login-alert" type="error" showIcon message={error} role="alert" />}
    {success ? <Alert className="login-alert" type="success" showIcon message="Request received" description={success} role="status" /> :
      <Form layout="vertical" onFinish={submit} requiredMark={false} disabled={submitting}>
        <Form.Item label="Username" name="username" rules={[{ required: true, whitespace: true, message: "Enter your username." }]}>
          <Input autoComplete="username" autoFocus maxLength={256} size="large" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={submitting}>Request password reset</Button>
      </Form>}
    <Typography.Paragraph style={{ marginTop: 20, marginBottom: 0 }}><Link to="/login">Back to sign in</Link></Typography.Paragraph>
  </Card></main>;
}
