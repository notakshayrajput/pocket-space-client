import { useEffect, useState } from "react";
import { Alert, Button, Card, Checkbox, Descriptions, Form, Input, InputNumber, Space, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/app-layout/AppLayout";
import PasswordFields from "../../components/password-fields/PasswordFields";
import HttpService from "../../services/http-service";
import { useAuth } from "../../auth/auth-context";

const GIB = 1024 ** 3;
interface StorageSettings {
  backend: "FileSystem" | "S3";
  globalLimitBytes: number | null;
  fileSystemPath: string | null;
  bucket: string | null;
  region: string | null;
}

export default function Settings() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageSettings, setStorageSettings] = useState<StorageSettings | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [storageSaved, setStorageSaved] = useState(false);
  const [savingStorage, setSavingStorage] = useState(false);
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [limitGiB, setLimitGiB] = useState<number | null>(5);

  useEffect(() => {
    if (!user?.roles.includes("Admin")) return;
    HttpService.getInstance().get<StorageSettings>("/admin/storage-settings").then(settings => {
      setStorageSettings(settings);
      setLimitEnabled(settings.globalLimitBytes !== null);
      setLimitGiB(settings.globalLimitBytes === null ? 5 : settings.globalLimitBytes / GIB);
    }).catch(failure => setStorageError(failure instanceof Error ? failure.message : "Could not load storage settings."));
  }, [user]);

  const saveStorage = async () => {
    if (limitEnabled && (!limitGiB || limitGiB <= 0)) return;
    setSavingStorage(true);
    setStorageError(null);
    setStorageSaved(false);
    try {
      await HttpService.getInstance().put<void>("/admin/storage-settings", {
        globalLimitBytes: limitEnabled ? Math.round(limitGiB! * GIB) : null,
      });
      const settings = await HttpService.getInstance().get<StorageSettings>("/admin/storage-settings");
      setStorageSettings(settings);
      setStorageSaved(true);
    } catch (failure) { setStorageError(failure instanceof Error ? failure.message : "Could not save storage settings."); }
    finally { setSavingStorage(false); }
  };
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
    {user?.roles.includes("Admin") && <Card title="File storage" style={{ maxWidth: 640, marginBottom: 24 }}>
      {storageError && <Alert style={{ marginBottom: 16 }} type="error" showIcon message={storageError} role="alert" />}
      {storageSaved && <Alert style={{ marginBottom: 16 }} type="success" showIcon message="Storage limit saved." />}
      {storageSettings && <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Provider">{storageSettings.backend === "S3" ? "AWS S3" : "File system"}</Descriptions.Item>
          {storageSettings.backend === "FileSystem"
            ? <Descriptions.Item label="Path"><Typography.Text copyable style={{ overflowWrap: "anywhere" }}>{storageSettings.fileSystemPath}</Typography.Text></Descriptions.Item>
            : <>
              <Descriptions.Item label="Bucket">{storageSettings.bucket}</Descriptions.Item>
              <Descriptions.Item label="Region">{storageSettings.region}</Descriptions.Item>
            </>}
        </Descriptions>
        <Checkbox checked={limitEnabled} onChange={event => setLimitEnabled(event.target.checked)}>Limit total storage</Checkbox>
        {limitEnabled && <InputNumber aria-label="Global storage limit in GiB" min={0.1} max={8192} precision={1}
          value={limitGiB} onChange={setLimitGiB} addonAfter="GiB" style={{ width: 220 }} />}
        <Button type="primary" loading={savingStorage} disabled={limitEnabled && (!limitGiB || limitGiB <= 0)}
          onClick={() => void saveStorage()}>Save limit</Button>
      </Space>}
    </Card>}
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
