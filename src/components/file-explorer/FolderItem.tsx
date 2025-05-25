import React from "react";
import { FolderOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import type { FileSystemEntry } from "../../types";
import { useNavigate } from "react-router-dom";

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
  return (
    <div
      key={item.relativePath}
      className={`file-item folder ${
        viewMode === "grid" ? "grid-item" : "list-item"
      }`}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      <FolderOutlined style={{ fontSize: 48 }} />
      <Tooltip title={item.name} placement="bottom">
        <div className="file-item-name">{item.name}</div>
      </Tooltip>
    </div>
  );
};

export default FolderItem;
