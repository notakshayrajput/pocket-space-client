import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FolderOutlined,
  FileOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  BarsOutlined,
} from "@ant-design/icons";
import SpaceService from "../../services/space-service";
import type { FolderInfo, FileSystemEntry } from "../../types";
import { Button, Segmented, Tooltip } from "antd";
import FolderItem from "./FolderItem";
import FileItem from "./FileItem";
import "./FileExplorer.css";
import UploadArea from "../upload-area/UploadArea";

const FileExplorer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const relativePath = searchParams.get("path");
  const [fileInfo, setFileInfo] = useState<FolderInfo>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const fetchFileInfo = async () => {
      try {
        const data = await SpaceService.getFolderInfo(relativePath);
        setFileInfo(data);
      } catch (error) {
        console.error("Error fetching file info:", error);
      }
    };

    fetchFileInfo();
  }, [relativePath]);

  const renderItem = (item: FileSystemEntry) =>
    item.isFolder ? (
      <FolderItem key={item.relativePath} item={item} viewMode={viewMode} />
    ) : (
      <FileItem key={item.relativePath} item={item} viewMode={viewMode} />
    );

  return (
    <div className="file-explorer">
      <UploadArea />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
          gap: 8,
        }}
      >
        <Segmented
          className="segmented-view-mode"
          options={[
            {
              value: "grid",
              icon: <AppstoreOutlined />,
              // label: <Tooltip title="Grid View">Grid</Tooltip>,
            },
            {
              value: "list",
              icon: <BarsOutlined />,
              // label: <Tooltip title="List View">List</Tooltip>,
            },
          ]}
          value={viewMode}
          onChange={(val) => setViewMode(val as "grid" | "list")}
        />
      </div>

      <div className={viewMode == "grid" ? "grid" : "list"}>
        {fileInfo?.files?.map(renderItem)}
      </div>
    </div>
  );
};

export default FileExplorer;
