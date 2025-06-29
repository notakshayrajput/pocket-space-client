import { Flex, Layout } from "antd";
import React from "react";
import "./AppLayout.css";
import Sidebar from "../../components/layout/sidebar/Sidebar";
import { ServerStatusIndicator } from "../../components/server-status-indicator/ServerStatusIndicator";

interface IAppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<IAppLayoutProps> = ({ children }) => {
  return (
    <Layout className="layout">
      <Flex className="layout">
        <Sidebar />
        <Flex className="panel" style={{ width: "100%" }} vertical>
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
