import { Avatar, Flex } from "antd";
import { FolderOutlined, MenuOutlined, ProductOutlined, SettingOutlined, KeyOutlined, DeleteOutlined, LogoutOutlined, UserOutlined, DatabaseOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "./Sidebar.css";
import BrandLogo from "../../icons/BrandLogo";
import { useAuth } from "../../../auth/auth-context";

const LOCAL_STORAGE_KEY = "pocketspace.sidebar-collapsed";

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
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
      <div className="sidebar-navigation">
        <Link to="/" className="sidebar-link" aria-label="Pocket Space" title="Pocket Space">
      <Flex className="sidebar-brand" align="center">
          <BrandLogo style={{ fontSize: 28 }} />
          {!collapsed && <span className="brand-title">Pocket Space</span>}
      </Flex>
        </Link>
      <Flex className="sidebar-item toggle-button" onClick={toggleSidebar}>
        <MenuOutlined className="sidebar-icon" />
        {!collapsed && <span className="sidebar-text">Menu</span>}
      </Flex>

        <Link to="/" className="sidebar-link" aria-label="Home" title="Home">
      <Flex className="sidebar-item">
          <ProductOutlined className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Home</span>}
      </Flex>
        </Link>
        <Link to="/files" className="sidebar-link" aria-label="Files" title="Files">
      <Flex className="sidebar-item">
          <FolderOutlined  className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Files</span>}
      </Flex>
        </Link>
      <Link to="/storage" className="sidebar-link" aria-label="Storage Info" title="Storage Info">
        <Flex className="sidebar-item"><DatabaseOutlined className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Storage Info</span>}
        </Flex>
      </Link>
      <Link to="/trash" className="sidebar-link" aria-label="Trash" title="Trash">
        <Flex className="sidebar-item"><DeleteOutlined className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Trash</span>}
        </Flex>
      </Link>
      <Link to="/settings" className="sidebar-link" aria-label="Settings" title="Settings">
        <Flex className="sidebar-item"><SettingOutlined className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Settings</span>}
        </Flex>
      </Link>
      {user?.roles.includes("Admin") && <Link to="/admin/password-resets" className="sidebar-link" aria-label="Password resets" title="Password resets">
        <Flex className="sidebar-item"><KeyOutlined className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Password resets</span>}
        </Flex>
      </Link>}
      {user?.roles.includes("Admin") && <Link to="/admin/quotas" className="sidebar-link" aria-label="User quotas" title="User quotas">
        <Flex className="sidebar-item"><DatabaseOutlined className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">User quotas</span>}
        </Flex>
      </Link>}
      {user?.roles.includes("Admin") && <Link to="/admin/users" className="sidebar-link" aria-label="Approvals" title="Approvals">
        <Flex className="sidebar-item"><ProductOutlined className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Approvals</span>}
        </Flex>
      </Link>}
      </div>
      <div className="sidebar-account">
        <div className="sidebar-account-profile">
          <span className="sidebar-avatar-wrap" title={collapsed ? user?.username : undefined}>
            <Avatar className="sidebar-avatar" size={36} icon={<UserOutlined />} />
          </span>
          {!collapsed && <span className="sidebar-account-name" title={user?.username}>{user?.username}</span>}
          <button className="sidebar-signout" type="button" onClick={logout} title="Sign out" aria-label="Sign out">
            <LogoutOutlined aria-hidden="true" />
          </button>
        </div>
      </div>
    </Flex>
  );
};

export default Sidebar;
