import { useState } from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/app-layout/AppLayout";
import PasswordFields from "../../components/password-fields/PasswordFields";
import HttpService from "../../services/http-service";
import { useAuth } from "../../auth/auth-context";

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
    setSubmitting(true);
    setError(null);
    try {
      await HttpService.getInstance().post<void>("/auth/change-password", { currentPassword, newPassword });
      logout();
      navigate("/login", { replace: true, state: { passwordChanged: true } });
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not change your password."); }
    finally { setSubmitting(false); }
  };

  return <AppLayout>
    <Typography.Title level={2}>Settings</Typography.Title>
    <Card title="Change password" style={{ maxWidth: 560 }}>
      <Typography.Paragraph type="secondary">Use your current password, or the password your administrator shared with you. After changing it, sign in again with your new password.</Typography.Paragraph>
      {error && <Alert style={{ marginBottom: 20 }} type="error" showIcon message={error} role="alert" />}
      <Form layout="vertical" onFinish={submit} requiredMark={false} disabled={submitting}>
        <Form.Item label="Current password" name="currentPassword" rules={[{ required: true, message: "Enter your current password." }]}>
          <Input.Password autoComplete="current-password" maxLength={1024} />
        </Form.Item>
        <PasswordFields />
        <Button type="primary" htmlType="submit" loading={submitting}>Change password</Button>
      </Form>
    </Card>
  </AppLayout>;
}
