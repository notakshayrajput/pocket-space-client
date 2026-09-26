import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AppstoreOutlined,
  BarsOutlined,
  CloseCircleOutlined,
  CheckSquareOutlined,
  DownloadOutlined,
  LoadingOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import type { FileSystemEntry } from "../../types";
import { Alert, Button, Empty, Input, Modal, Segmented, Select, App, Flex, Spin } from "antd";
import HttpService from "../../services/http-service";
import "./FileExplorer.css";
import UploadArea from "../upload-area/UploadArea";
import FileExplorerItem from "./FileExplorerItem";
import { filterAndSortFiles, type FileSortDirection, type FileSortField } from "./file-list";
import { downloadFile } from "../../services/util";
import { clearFileCache, fetchFolderInfoIfNeeded } from "../../store/features/fileExplorer/fileExplorerSlice";
import type { RootState, AppDispatch } from "../../store/store";
const FileExplorer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const relativePath = searchParams.get("path") || ".";
  // const [fileInfo, setFileInfo] = useState<FolderInfo>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<FileSortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<FileSortDirection>("desc");
  const [selectedItems, setSelectedItems] = useState<Set<FileSystemEntry>>(
    new Set()
  );
  const { notification } = App.useApp();
  const [selectionMode, setSelectionMode] = useState(false);
  const [creating, setCreating] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [saving, setSaving] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.fileExplorer.loadingPaths[relativePath]);
  const error = useSelector((state: RootState) => state.fileExplorer.errors[relativePath]);
  const refresh = () => {
    setSelectedItems(new Set());
    dispatch(clearFileCache());
    void dispatch(fetchFolderInfoIfNeeded(relativePath));
  };
  const createFolder = async () => {
    setSaving(true);
    try {
      await HttpService.getInstance().post<void>("/space/folders", { parentPath: relativePath, name: folderName });
      setCreating(false);
      setFolderName("");
      refresh();
    } catch (failure) {
      notification.error({ message: failure instanceof Error ? failure.message : "Could not create folder." });
    } finally { setSaving(false); }
  };
  const fileInfo = useSelector((state: RootState) => {
    if (relativePath===undefined || relativePath === null) return undefined;
    return state.fileExplorer.cache[relativePath];
  });
  const visibleFiles = useMemo(() => filterAndSortFiles(
    fileInfo?.files ?? [], searchQuery, sortField, sortDirection,
  ), [fileInfo?.files, searchQuery, sortField, sortDirection]);

  useEffect(() => {
    setSelectedItems(new Set());
    setSearchQuery("");
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
      onChanged={refresh}
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
      <UploadArea onUploaded={refresh} />
      <Modal title="New folder" open={creating} onCancel={() => setCreating(false)} onOk={() => void createFolder()}
        confirmLoading={saving} okButtonProps={{ disabled: !folderName.trim() }}>
        <Input aria-label="Folder name" value={folderName} onChange={event => setFolderName(event.target.value)} />
      </Modal>
      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        style={{
          marginBottom: 16,
          gap: 8,
        }}
      >
        <Flex
          wrap="wrap"
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
          <Button onClick={() => setCreating(true)}>New folder</Button>
          <Button onClick={refresh}>Refresh</Button>
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
        <Flex align="center" wrap="wrap" gap={8}>
          <Input
            className="file-search"
            aria-label="Search file names in this folder"
            placeholder="Search this folder"
            prefix={<SearchOutlined />}
            allowClear
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
          <Select<FileSortField>
            className="file-sort"
            aria-label="Sort files by"
            value={sortField}
            options={[
              { label: "Name", value: "name" },
              { label: "Size", value: "size" },
              { label: "Date modified", value: "lastModified" },
              { label: "Date created", value: "createdAt" },
            ]}
            onChange={value => {
              setSortField(value);
              setSortDirection(value === "name" ? "asc" : "desc");
            }}
          />
          <Button
            aria-label={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}
            title={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}
            icon={sortDirection === "asc" ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
            onClick={() => setSortDirection(value => value === "asc" ? "desc" : "asc")}
          />
          <Segmented
            className="segmented-view-mode"
            options={[
              { value: "grid", icon: <AppstoreOutlined /> },
              { value: "list", icon: <BarsOutlined /> },
            ]}
            value={viewMode}
            onChange={(val) => setViewMode(val as "grid" | "list")}
          />
        </Flex>
      </Flex>

      {error && <Alert type="error" showIcon message={error} />}
      {loading && <Spin aria-label="Loading files" />}
      {!loading && !error && fileInfo?.files.length === 0 && <Empty description="Your folder is empty. Upload a file to get started." />}
      {!loading && !error && fileInfo && fileInfo.files.length > 0 && visibleFiles.length === 0 && (
        <Empty description="No matching names in this folder.">
          <Button onClick={() => setSearchQuery("")}>Clear search</Button>
        </Empty>
      )}
      <div className={viewMode == "grid" ? "grid" : "list"}>
        {visibleFiles.map(renderItem)}
      </div>
    </div>
  );
};

export default FileExplorer;
