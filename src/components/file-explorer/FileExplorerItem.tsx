import React, { useState } from "react";
import {
  DownloadOutlined,
  FolderOutlined,
  FileOutlined,
  LoadingOutlined,
  MoreOutlined,
  StarFilled,
  StarOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, App, Input, Modal, Tooltip, type MenuProps } from "antd";
import HttpService from "../../services/http-service";
import FileService from "../../services/file-service";
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
  showLocation?: boolean;
}> = ({ item, viewMode, selectionMode, selected, onToggleSelect, onChanged, showLocation }) => {
  const navigate = useNavigate();
  const path = `/files?path=${encodeURIComponent(item.relativePath)}`;
  const { notification, modal } = App.useApp();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(item.name);
  const [saving, setSaving] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const favorite = async () => {
    setFavoriting(true);
    try {
      await FileService.setFavorite(item.id, !item.isFavorite);
      onChanged();
    } catch (failure) {
      notification.error({ message: failure instanceof Error ? failure.message : "Could not update favorite." });
    } finally { setFavoriting(false); }
  };
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
    title: `Move ${item.name} to Trash?`,
    content: item.isFolder ? "This folder and its contents will be kept in Trash for seven days. You can restore them before they are automatically deleted." : "This file will be kept in Trash for seven days. You can restore it before it is automatically deleted.",
    okText: "Move to Trash", okButtonProps: { danger: true },
    onOk: async () => {
      try {
        await HttpService.getInstance().delete<void>(`/space/entry?path=${encodeURIComponent(item.relativePath)}`);
        notification.success({ message: "Moved to Trash", description: "You have seven days to restore this item." });
        onChanged();
      } catch (failure) {
        notification.error({ message: failure instanceof Error ? failure.message : "Could not move to Trash." });
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
      onChanged();

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
      { key: "location", label: "Open containing folder", icon: <FolderOpenOutlined />,
        onClick: () => navigate(`/files?path=${encodeURIComponent(item.relativePath.split('/').slice(0, -1).join('/') || '.')}`) },
      { key: "delete", label: "Move to Trash", icon: <DeleteOutlined />, danger: true, onClick: remove },
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
            <Button type="text" size="small" aria-label={`Actions for ${item.name}`} icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      )}

      {!isFolder && !selectionMode && <Tooltip title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}>
        <Button type="text" size="small" className={viewMode === "grid" ? "favorite-grid" : undefined}
          aria-label={`${item.isFavorite ? "Remove from" : "Add to"} favorites: ${item.name}`}
          aria-pressed={item.isFavorite} loading={favoriting}
          icon={item.isFavorite ? <StarFilled style={{ color: "#ad6800" }} /> : <StarOutlined />}
          onClick={event => { event.stopPropagation(); void favorite(); }} />
      </Tooltip>}

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
        <div className="file-item-details">
          <Tooltip title={item.name} placement="bottom">
            <div className="file-item-name">{item.name}</div>
          </Tooltip>
          {showLocation && <div className="file-item-location" title={item.relativePath}>{item.relativePath}</div>}
          {showLocation && <div className="file-item-location">Last used {new Date(item.recentAt).toLocaleString()}</div>}
        </div>

        {showLocation && <Button type="text" aria-label={`Download ${item.name}`} icon={<DownloadOutlined />} loading={downloading}
          onClick={event => { event.stopPropagation(); void handleDownload(); }} />}

        {viewMode === "list" && menuItems.length > 0 && (
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <Button type="text" size="small" aria-label={`Actions for ${item.name}`} icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
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
