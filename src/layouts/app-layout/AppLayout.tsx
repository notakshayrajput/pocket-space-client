import { Flex, Layout } from "antd";
import React from "react";
import "./AppLayout.css";
import Sidebar from "../../components/layout/sidebar/Sidebar";

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
        </Flex>
      </Flex>
    </Layout>
  );
};

export default AppLayout;
