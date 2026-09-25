import React, { useState } from "react";
import {
  DownloadOutlined,
  FolderOutlined,
  FileOutlined,
  LoadingOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Dropdown, App, Input, Modal, Tooltip, type MenuProps } from "antd";
import HttpService from "../../services/http-service";
import { useNavigate } from "react-router-dom";
import type { FileSystemEntry } from "../../types";
import { downloadFile } from "../../services/util";

const FileExplorerItem: React.FC<{
  item: FileSystemEntry;
  viewMode: "grid" | "list";
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onChanged: () => void;
}> = ({ item, viewMode, selectionMode, selected, onToggleSelect, onChanged }) => {
  const navigate = useNavigate();
  const path = `/files?path=${encodeURIComponent(item.relativePath)}`;
  const { notification, modal } = App.useApp();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(item.name);
  const [saving, setSaving] = useState(false);
  const rename = async () => {
    setSaving(true);
    try {
      await HttpService.getInstance().post<void>("/space/rename", { path: item.relativePath, name });
      setRenaming(false);
      onChanged();
    } catch (failure) {
      notification.error({ message: failure instanceof Error ? failure.message : "Rename failed." });
    } finally { setSaving(false); }
  };
  const remove = () => modal.confirm({
    title: `Delete ${item.name}?`,
    content: item.isFolder ? "This permanently deletes the folder and all files inside it." : "This permanently deletes the file.",
    okText: "Delete", okButtonProps: { danger: true },
    onOk: async () => {
      try {
        await HttpService.getInstance().delete<void>(`/space/entry?path=${encodeURIComponent(item.relativePath)}`);
        onChanged();
      } catch (failure) {
        notification.error({ message: failure instanceof Error ? failure.message : "Delete failed." });
        throw failure;
      }
    },
  });
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
      { key: "rename", label: "Rename", onClick: () => { setName(item.name); setRenaming(true); } },
      { key: "delete", label: "Delete", danger: true, onClick: remove },
    ];
  // : [];

  return (
    <>
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
    <Modal title="Rename" open={renaming} onCancel={() => setRenaming(false)} onOk={() => void rename()}
      confirmLoading={saving} okButtonProps={{ disabled: !name.trim() }}>
      <Input aria-label="New name" value={name} onChange={event => setName(event.target.value)} />
    </Modal>
    </>
  );
};

export default FileExplorerItem;
