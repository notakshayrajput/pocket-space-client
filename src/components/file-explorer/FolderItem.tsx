import React, { useState } from "react";
import { DownloadOutlined, FolderOutlined, LoadingOutlined, MoreOutlined } from "@ant-design/icons";
import { App, Dropdown, Tooltip, type MenuProps } from "antd";
import type { FileSystemEntry } from "../../types";
import { useNavigate } from "react-router-dom";
import { downloadFile } from "../../services/util";

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
  
  const [downloading, setDownloading] = useState(false);
  const menuItems: MenuProps["items"] = [
    {
      key: "download",
      label: downloading ? "Preparing" : "Download",
      onClick: () => handleDownload(),
      className: `download-item ${downloading ? "downloading" : ""}`,
      icon: downloading ? <LoadingOutlined  className="loading-icon"/> : <DownloadOutlined />,
    },
  ];
  const {notification} = App.useApp();

  const handleDownload = async () => {
  const filePath = item.relativePath;
  setDownloading(true);

  const key = `download-${filePath}`;
  notification.open({
    key,
    message: "Serving it right up...",
    description: (
      <>
        Getting <strong>{item.name}</strong> ready for you.
      </>
    ),
    icon: <LoadingOutlined />,
    duration: 0,
  });

  try {
    await downloadFile([filePath]);

    // Update notification to show "Download started" and auto-close in 3s
    notification.success({
      key,
      message: "Download started!",
      description: (
        <>
          <strong>{item.name}</strong> is on its way.
        </>
      ),
      duration: 3,
    });
  } catch (error) {
    console.error("Download error:", error);
    notification.error({
      key,
      message: "Download Failed",
      description: "There was an error while downloading.",
    });
  } finally {
    setDownloading(false);
  }
};
  return (
    <div
      key={item.relativePath}
      className={`file-item  ${downloading ? "downloading" : ""} folder ${viewMode === "grid" ? "grid-item" : "list-item"}`}
        
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
