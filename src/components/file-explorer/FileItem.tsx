import React from "react";
import { FileOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import type { FileSystemEntry } from "../../types";

const FileItem: React.FC<{
  item: FileSystemEntry;
  viewMode: "grid" | "list";
}> = ({ item, viewMode }) => {
  const dotIndex = item.name.lastIndexOf(".");
  const base = dotIndex !== -1 ? item.name.slice(0, dotIndex) : item.name;
  const ext = dotIndex !== -1 ? item.name.slice(dotIndex) : "";

  return (
    <div
      key={item.relativePath}
      className={`file-item ${viewMode === "grid" ? "grid-item" : "list-item"}`}
    >
      <FileOutlined style={{ fontSize: 48 }} />
      <Tooltip title={item.name}  placement="bottom">
        <div
          className="file-item-name"
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
              maxWidth: "calc(100% - 40px)",
              display: "inline-block",
            }}
          >
            {base}
          </span>
          <span style={{ flexShrink: 0}}>{ext}</span>
        </div>
      </Tooltip>
    </div>
  );
};

export default FileItem;
