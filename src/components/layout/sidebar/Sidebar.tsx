import { Flex } from "antd";
import { FolderOutlined, MenuOutlined, ProductOutlined, SettingOutlined, KeyOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "./Sidebar.css"; // Make sure this CSS file exists
import BrandLogo from "../../icons/BrandLogo";
import { useAuth } from "../../../auth/auth-context";

const LOCAL_STORAGE_KEY = "pocketspace.sidebar-collapsed";

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState( localStorage.getItem(LOCAL_STORAGE_KEY) === "true" || false);

  // On initial load: read from localStorage
  useEffect(() => {
    const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedValue !== null) {
      setCollapsed(storedValue === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem(LOCAL_STORAGE_KEY, newValue.toString());
  };
  return (
    <Flex className={`sidebar ${collapsed ? "collapsed" : ""}`} vertical>
        <Link to="/" className="sidebar-link">
      <Flex className="sidebar-brand" align="center">
          <BrandLogo style={{ fontSize: 28 }} />
          {!collapsed && <span className="brand-title">Pocket Space</span>}
      </Flex>
        </Link>
      <Flex className="sidebar-item toggle-button" onClick={toggleSidebar}>
        <MenuOutlined className="sidebar-icon" />
        {!collapsed && <span className="sidebar-text">Menu</span>}
      </Flex>

        <Link to="/" className="sidebar-link">
      <Flex className="sidebar-item">
          <ProductOutlined className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Home</span>}
      </Flex>
        </Link>
        <Link to="/files" className="sidebar-link">
      <Flex className="sidebar-item">
          <FolderOutlined  className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Files</span>}
      </Flex>
        </Link>
      <Link to="/settings" className="sidebar-link" aria-label="Settings">
        <Flex className="sidebar-item"><SettingOutlined className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Settings</span>}
        </Flex>
      </Link>
      {user?.roles.includes("Admin") && <Link to="/admin/password-resets" className="sidebar-link" aria-label="Password resets">
        <Flex className="sidebar-item"><KeyOutlined className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Password resets</span>}
        </Flex>
      </Link>}
      {user?.roles.includes("Admin") && <Link to="/admin/users" className="sidebar-link">
        <Flex className="sidebar-item"><ProductOutlined className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Approvals</span>}
        </Flex>
      </Link>}
    </Flex>
  );
};

export default Sidebar;
