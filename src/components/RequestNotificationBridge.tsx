import { useLayoutEffect, type ReactNode } from "react";
import { App } from "antd";
import { registerRequestNotifications } from "../services/request-notifications";

export default function RequestNotificationBridge({ children }: { children: ReactNode }) {
  const { notification } = App.useApp();
  useLayoutEffect(() => registerRequestNotifications(notification), [notification]);
  return children;
}
