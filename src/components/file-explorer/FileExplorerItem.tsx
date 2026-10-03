import React, { useState } from "react";
import {
  DownloadOutlined,
  MoreOutlined,
  StarFilled,
  StarOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  EyeOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, App, Input, Modal, Tooltip, type MenuProps } from "antd";
import HttpService from "../../services/http-service";
import FileService from "../../services/file-service";
import { useNavigate } from "react-router-dom";
import type { FileSystemEntry } from "../../types";
import { transferManager } from "../../services/transfer-manager";
import { openPreviewTab, previewRoute } from "../../services/preview-service";
import FileThumbnail from "./FileThumbnail";

const FileExplorerItem: React.FC<{
  item: FileSystemEntry;
  viewMode: "grid" | "list";
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onChanged: () => void;
  showLocation?: boolean;
  onPreview?: (item: FileSystemEntry) => void;
}> = ({ item, viewMode, selectionMode, selected, onToggleSelect, onChanged, showLocation, onPreview }) => {
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
    } catch {
      // The request layer displays the failure.
    } finally { setFavoriting(false); }
  };
  const rename = async () => {
    setSaving(true);
    try {
      await HttpService.getInstance().post<void>("/space/rename", { path: item.relativePath, name });
      setRenaming(false);
      onChanged();
    } catch {
      // The request layer displays the failure.
    } finally { setSaving(false); }
  };
  const remove = () => modal.confirm({
    title: `Move ${item.name} to Trash?`,
    content: item.isFolder ? "This folder and its contents will be kept in Trash for seven days. You can restore them before they are automatically deleted." : "This file will be kept in Trash for seven days. You can restore it before it is automatically deleted.",
    okText: "Move to Trash", okButtonProps: { danger: true },
    onOk: async () => {
      await HttpService.getInstance().delete<void>(`/space/entry?path=${encodeURIComponent(item.relativePath)}`);
      onChanged();
    },
  });

  const isFolder = item.isFolder;

  const handleDoubleClick = () => {
    if (selectionMode) {
      // onToggleSelect?.();
    } else if (isFolder) {
      navigate(path);
    }
  };

  const showPreview = () => {
    if (onPreview) onPreview(item);
    else navigate(previewRoute(item.relativePath));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (isFolder) window.open(path, "_blank");
      else openPreviewTab(item.relativePath);
    } else if (!isFolder) {
      showPreview();
    }
  };

  const handleDownload = () => {
    try {
      transferManager.enqueueDownload([item.relativePath], item.isFolder ? `${item.name}.zip` : item.name);
    } catch (error) {
      notification.error({ message: "Could not start download", description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const menuItems: MenuProps["items"] =
    //!isFolder?
    [
      {
        key: "download",
        label: "Download",
        onClick: handleDownload,
        icon: <DownloadOutlined />,
      },
      ...(!isFolder ? [
        { key: "preview", label: "Preview", icon: <EyeOutlined />, onClick: showPreview },
        { key: "new-tab", label: "Open preview in new tab", icon: <ExportOutlined />,
          onClick: () => openPreviewTab(item.relativePath) },
      ] : []),
      { key: "rename", label: "Rename", onClick: () => { setName(item.name); setRenaming(true); } },
      ...(showLocation ? [{ key: "location", label: "Open containing folder", icon: <FolderOpenOutlined />,
        onClick: () => navigate(`/files?path=${encodeURIComponent(item.relativePath.split('/').slice(0, -1).join('/') || '.')}`) }] : []),
      { key: "delete", label: "Move to Trash", icon: <DeleteOutlined />, danger: true, onClick: remove },
    ];
  // : [];

  return (
    <>
    <div
      key={item.relativePath}
      className={`file-item ${isFolder ? "folder" : ""} ${viewMode === "grid" ? "grid-item" : "list-item"}`}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        if (selectionMode) {
          onToggleSelect?.();
        } else {
          handleClick(e);
        }
      }}
      style={{
        cursor: selectionMode || !isFolder ? "pointer" : "default",
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
      <FileThumbnail item={item} />

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

        {showLocation && <Button type="text" aria-label={`Download ${item.name}`} icon={<DownloadOutlined />}
          onClick={event => { event.stopPropagation(); handleDownload(); }} />}

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
