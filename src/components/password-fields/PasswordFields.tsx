import { Form, Input } from "antd";

export default function PasswordFields() {
  return <>
    <Form.Item label="New password" name="newPassword" extra="At least 8 characters, including a lowercase letter, number, and symbol."
      rules={[{ required: true, message: "Enter a new password." }, { min: 8, message: "Use at least 8 characters." }]}>
      <Input.Password autoComplete="new-password" maxLength={1024} />
    </Form.Item>
    <Form.Item label="Confirm new password" name="confirmPassword" dependencies={["newPassword"]} rules={[
      { required: true, message: "Confirm the new password." },
      ({ getFieldValue }) => ({ validator: (_, value) => !value || getFieldValue("newPassword") === value
        ? Promise.resolve() : Promise.reject(new Error("Passwords do not match.")) }),
    ]}><Input.Password autoComplete="new-password" maxLength={1024} /></Form.Item>
  </>;
}
