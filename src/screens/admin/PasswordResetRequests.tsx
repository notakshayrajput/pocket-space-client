import { useCallback, useEffect, useState } from "react";
import { Alert, App, Button, Flex, Form, Modal, Table, Typography } from "antd";
import { Navigate } from "react-router-dom";
import AppLayout from "../../layouts/app-layout/AppLayout";
import PasswordFields from "../../components/password-fields/PasswordFields";
import { useAuth } from "../../auth/auth-context";
import HttpService from "../../services/http-service";

interface ResetRequest { id: string; username: string; passwordResetRequestedAt: string }

export default function PasswordResetRequests() {
  const { user, logout } = useAuth();
  const isAdmin = user?.roles.includes("Admin");
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ResetRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try { setRequests(await HttpService.getInstance().get<ResetRequest[]>("/admin/users/password-reset-requests")); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not load reset requests."); }
    finally { setLoading(false); }
  }, [isAdmin]);
  useEffect(() => { void load(); }, [load]);
  if (!isAdmin) return <Navigate to="/" replace />;

  const reset = async ({ newPassword }: { newPassword: string }) => {
    if (!selected) return;
    setSubmitting(true);
    setResetError(null);
    try {
      await HttpService.getInstance().post<void>(`/admin/users/${selected.id}/reset-password`, { newPassword });
      message.success(`Password reset for ${selected.username}. Share the password directly and ask them to change it in Settings.`, 8);
      form.resetFields();
      setSelected(null);
      if (selected.id === user?.id) { logout(); return; }
      await load();
    } catch (failure) { setResetError(failure instanceof Error ? failure.message : "Could not reset the password."); }
    finally { setSubmitting(false); }
  };

  return <AppLayout>
    <Flex justify="space-between" align="center" gap={12}>
      <Typography.Title level={2}>Password reset requests</Typography.Title>
      <Button onClick={() => void load()} loading={loading}>Refresh</Button>
    </Flex>
    <Typography.Paragraph type="secondary">Verify the user&apos;s identity, set a new password, and share it with them directly. They can choose their own password in Settings.</Typography.Paragraph>
    {error && <Alert type="error" showIcon message={error} role="alert" />}
    <Table rowKey="id" dataSource={requests} loading={loading} scroll={{ x: 550 }} locale={{ emptyText: "No password reset requests." }} columns={[
      { title: "Username", dataIndex: "username" },
      { title: "Requested", dataIndex: "passwordResetRequestedAt", render: (value: string) => new Date(value).toLocaleString() },
      { title: "Action", key: "action", render: (_, account) => <Button onClick={() => { form.resetFields(); setResetError(null); setSelected(account); }}>Set new password</Button> },
    ]} />
    <Modal title={`Reset password for ${selected?.username ?? ""}`} open={selected !== null} footer={null}
      closable={!submitting} maskClosable={!submitting} keyboard={!submitting} onCancel={() => { form.resetFields(); setSelected(null); }}>
      <Typography.Paragraph>Keep the password ready to share with this user. Existing sign-ins will be invalidated. The password cannot be retrieved after saving.</Typography.Paragraph>
      {resetError && <Alert style={{ marginBottom: 16 }} type="error" showIcon message={resetError} role="alert" />}
      <Form form={form} layout="vertical" onFinish={reset} requiredMark={false} disabled={submitting}>
        <PasswordFields />
        <Button type="primary" htmlType="submit" loading={submitting}>Reset password</Button>
      </Form>
    </Modal>
  </AppLayout>;
}
