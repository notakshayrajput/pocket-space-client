import React, { useState } from "react";
import {
  DownloadOutlined,
  FolderOutlined,
  FileOutlined,
  LoadingOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Dropdown, App, Tooltip, type MenuProps } from "antd";
import { useNavigate } from "react-router-dom";
import type { FileSystemEntry } from "../../types";
import { downloadFile } from "../../services/util";

const FileExplorerItem: React.FC<{
  item: FileSystemEntry;
  viewMode: "grid" | "list";
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}> = ({ item, viewMode, selectionMode, selected, onToggleSelect }) => {
  const navigate = useNavigate();
  const path = `/files?path=${encodeURIComponent(item.relativePath)}`;
  const { notification } = App.useApp();
  const [downloading, setDownloading] = useState(false);

  const isFolder = item.isFolder;

  const handleDoubleClick = () => {
    if (selectionMode) {
      // onToggleSelect?.();
    } else if (isFolder) {
      navigate(path);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      window.open(path, "_blank");
    }
  };

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

  const menuItems: MenuProps["items"] =
    //!isFolder?
    [
      {
        key: "download",
        label: downloading ? "Preparing" : "Download",
        onClick: handleDownload,
        className: `download-item ${downloading ? "downloading" : ""}`,
        icon: downloading ? (
          <LoadingOutlined className="loading-icon" />
        ) : (
          <DownloadOutlined />
        ),
      },
    ];
  // : [];

  return (
    <div
      key={item.relativePath}
      className={`file-item ${isFolder ? "folder" : ""} ${
        downloading ? "downloading" : ""
      } ${viewMode === "grid" ? "grid-item" : "list-item"}`}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        if (selectionMode) {
          onToggleSelect?.();
        } else {
          handleClick(e);
        }
      }}
      style={{
        cursor: isFolder ? "pointer" : "default",
        position: "relative",
        border: selected ? "2px solid #1890ff" : undefined,
        borderRadius: 4,
      }}
    >
      {/* Grid mode dropdown */}
      {viewMode === "grid" && menuItems.length > 0 && (
        <div className="more-icon-grid">
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <MoreOutlined
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 18, cursor: "pointer" }}
            />
          </Dropdown>
        </div>
      )}

      {/* Icon */}
      {isFolder ? (
        <FolderOutlined style={{ fontSize: 48 }} />
      ) : (
        <FileOutlined style={{ fontSize: 48 }} />
      )}

      {/* Name + List mode menu */}
      <div className="file-item-bottom">
        {selectionMode && (
          <input
            type="checkbox"
            id={`select-${item.relativePath}`}
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              // onToggleSelect?.();
            }}
            style={{ position: "absolute", top: 8, left: 8, zIndex: 1 }}
          />
        )}
        <Tooltip title={item.name} placement="bottom">
          <div className="file-item-name">{item.name}</div>
        </Tooltip>

        {viewMode === "list" && menuItems.length > 0 && (
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

export default FileExplorerItem;
