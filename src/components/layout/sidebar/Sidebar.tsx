import { Flex } from "antd";
import { FolderOutlined, MenuOutlined, ProductOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "./Sidebar.css"; // Make sure this CSS file exists
import BrandLogo from "../../icons/BrandLogo";

interface ISidebarProps {}

const LOCAL_STORAGE_KEY = "pocketspace.sidebar-collapsed";

const Sidebar: React.FC = () => {
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
      <Flex className="sidebar-brand" align="center">
        <Link to="/" className="sidebar-link">
          <BrandLogo style={{ fontSize: 28 }} />
          {!collapsed && <span className="brand-title">Pocket Space</span>}
        </Link>
      </Flex>
      <Flex className="sidebar-item toggle-button" onClick={toggleSidebar}>
        <MenuOutlined className="sidebar-icon" />
        {!collapsed && <span className="sidebar-text">Menu</span>}
      </Flex>

      <Flex className="sidebar-item">
        <Link to="/" className="sidebar-link">
          <ProductOutlined className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Home</span>}
        </Link>
      </Flex>
      <Flex className="sidebar-item">
        <Link to="/files" className="sidebar-link">
          <FolderOutlined  className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Files</span>}
        </Link>
      </Flex>
    </Flex>
  );
};

export default Sidebar;
