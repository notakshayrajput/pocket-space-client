import { Alert, Button, Flex, Layout } from "antd";
import { useAuth } from "../../auth/auth-context";
import React from "react";
import "./AppLayout.css";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import { ServerStatusIndicator } from "../../components/server-status-indicator/ServerStatusIndicator";

interface IAppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<IAppLayoutProps> = ({ children }) => {
  const { user, retry } = useAuth();
  return (
    <Layout className="layout">
      <Flex className="layout">
        <Sidebar />
        <Flex className="panel" style={{ width: "100%",overflow:'auto' }} vertical>
          {user?.status === "Pending" && user.pendingExpiresAt && <Alert type="warning" showIcon
            style={{ marginBottom: 16 }} message="Waiting for admin approval"
            description={`You can use your folder now. Your account and files will be deleted on ${new Date(user.pendingExpiresAt).toLocaleString()} unless an admin approves your account.`}
            action={<Button size="small" onClick={retry}>Check approval</Button>} />}
          {children}
          <Flex className="footer" justify="center" align="center">
            <ServerStatusIndicator />
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  );
};

export default AppLayout;
