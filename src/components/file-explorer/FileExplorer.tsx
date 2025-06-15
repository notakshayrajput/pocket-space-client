import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AppstoreOutlined,
  BarsOutlined,
  CloseCircleOutlined,
  CheckSquareOutlined,
  DownloadOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import type { FileSystemEntry } from "../../types";
import { Button, Segmented, App, Flex } from "antd";
import "./FileExplorer.css";
import UploadArea from "../upload-area/UploadArea";
import FileExplorerItem from "./FileExplorerItem";
import { downloadFile } from "../../services/util";
import { fetchFolderInfoIfNeeded } from "../../store/features/fileExplorer/fileExplorerSlice";
import type { RootState, AppDispatch } from "../../store/store";
const FileExplorer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const relativePath = searchParams.get("path") || ".";
  // const [fileInfo, setFileInfo] = useState<FolderInfo>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItems, setSelectedItems] = useState<Set<FileSystemEntry>>(
    new Set()
  );
  const { notification } = App.useApp();
  const [selectionMode, setSelectionMode] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const fileInfo = useSelector((state: RootState) => {
    if (relativePath===undefined || relativePath === null) return undefined;
    return state.fileExplorer.cache[relativePath];
  });

  useEffect(() => {
    if (relativePath===undefined || relativePath === null) return; {
      dispatch(fetchFolderInfoIfNeeded(relativePath));
    }
  }, [relativePath, dispatch]);

  const renderItem = (item: FileSystemEntry) => (
    <FileExplorerItem
      key={item.relativePath}
      item={item}
      viewMode={viewMode}
      selectionMode={selectionMode}
      selected={selectedItems.has(item)}
      onToggleSelect={() => toggleSelection(item)}
    />
  );
  const toggleSelection = (item: FileSystemEntry) => {
    setSelectedItems((prev) => {
      const updated = new Set(prev);
      if (updated.has(item)) {
        updated.delete(item);
      } else {
        updated.add(item);
      }
      return updated;
    });
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };
  const handleDownloadSelectedFiles = async () => {
    const files = Array.from(selectedItems);
    const filePaths = files.map((file) => file.relativePath);
    if (filePaths.length === 0) {
      notification.warning({
        message: "No files to download",
        description: "Please select at least one file to download.",
      });
      return;
    }

    const key = `download-multiple-${Date.now()}`;

    notification.open({
      key,
      message: "Preparing your download...",
      description: "Hang tight, we're gathering your files.",
      icon: <LoadingOutlined />,
      duration: 0,
    });

    try {
      await downloadFile(filePaths);
      notification.success({
        key,
        message: "Download started!",
        description: `${filePaths.length} file(s) are being downloaded.`,
        duration: 3,
      });
    } catch (error) {
      console.error("Download failed:", error);
      notification.error({
        key,
        message: "Download Failed",
        description: "Something went wrong during the download process.",
      });
    }
  };

  return (
    <div className="file-explorer">
      <UploadArea />
      <Flex
        justify="space-between"
        style={{
          marginBottom: 16,
          gap: 8,
        }}
      >
        <Flex
          style={{
            gap: 8,
          }}
        >
          <Button
            onClick={() => setSelectionMode(!selectionMode)}
            icon={<CheckSquareOutlined />}
          >
            {selectionMode ? "Exit Selection" : "Select Items"}
          </Button>
          {selectionMode && (
            <>
              <Button onClick={clearSelection} icon={<CloseCircleOutlined />}>
                Clear
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                disabled={selectedItems.size === 0}
                onClick={handleDownloadSelectedFiles}
              >
                Download
              </Button>
            </>
          )}
        </Flex>
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
      </Flex>

      <div className={viewMode == "grid" ? "grid" : "list"}>
        {fileInfo?.files?.map(renderItem)}
      </div>
    </div>
  );
};

export default FileExplorer;
