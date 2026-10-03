import React from "react";
import { DownloadOutlined, FolderOutlined, MoreOutlined } from "@ant-design/icons";
import { App, Dropdown, Tooltip, type MenuProps } from "antd";
import type { FileSystemEntry } from "../../types";
import { useNavigate } from "react-router-dom";
import { transferManager } from "../../services/transfer-manager";

const FolderItem: React.FC<{
  item: FileSystemEntry;
  viewMode: "grid" | "list";
}> = ({ item, viewMode }) => {
  const navigate = useNavigate();
  const path = `/files?path=${encodeURIComponent(item.relativePath)}`;

  const handleDoubleClick = () => {
    navigate(path);
  };
  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl (Windows/Linux) or Cmd (Mac) + Click
      window.open(path, "_blank");
    }
  };
  
  const menuItems: MenuProps["items"] = [
    {
      key: "download",
      label: "Download",
      onClick: () => handleDownload(),
      icon: <DownloadOutlined />,
    },
  ];
  const {notification} = App.useApp();

  const handleDownload = () => {
    try {
      transferManager.enqueueDownload([item.relativePath], `${item.name}.zip`);
    } catch (error) {
      notification.error({ message: "Could not start download", description: error instanceof Error ? error.message : "Please try again." });
    }
  };
  return (
    <div
      key={item.relativePath}
      className={`file-item folder ${viewMode === "grid" ? "grid-item" : "list-item"}`}
        
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >

      {/* Dropdown for grid mode - top right */}
      {viewMode === "grid" && (
        <div className="more-icon-grid">
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <MoreOutlined
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 18, cursor: "pointer" }}
            />
          </Dropdown>
        </div>
      )}
      <FolderOutlined style={{ fontSize: 48 }} />
     {/* File name and menu in list mode */}
      <div className="file-item-bottom">
        <Tooltip title={item.name} placement="bottom">
          <div className="file-item-name">
            {item.name}
          </div>
        </Tooltip>

        {/* Dropdown for list mode - right aligned */}
        {viewMode === "list" && (
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <MoreOutlined
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 18, marginLeft: "auto", cursor: "pointer" }}
            />
          </Dropdown>
        )}
      </div>
    </div>
  );
};

export default FolderItem;
