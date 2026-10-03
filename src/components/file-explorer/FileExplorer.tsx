import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AppstoreOutlined,
  BarsOutlined,
  CloseCircleOutlined,
  CheckSquareOutlined,
  DownloadOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import type { FileSortDirection, FileSortField, FileSystemEntry } from "../../types";
import { Alert, Button, Empty, Input, Modal, Segmented, Select, App, Flex, Spin } from "antd";
import HttpService from "../../services/http-service";
import "./FileExplorer.css";
import UploadArea from "../upload-area/UploadArea";
import FileExplorerItem from "./FileExplorerItem";
import { transferManager } from "../../services/transfer-manager";
import { clearFileCache, fetchFolderPage, folderQueryKey } from "../../store/features/fileExplorer/fileExplorerSlice";
import type { RootState, AppDispatch } from "../../store/store";
const FileExplorer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const relativePath = searchParams.get("path") || ".";
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortField, setSortField] = useState<FileSortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<FileSortDirection>("desc");
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(
    new Set()
  );
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { notification } = App.useApp();
  const [selectionMode, setSelectionMode] = useState(false);
  const [creating, setCreating] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [saving, setSaving] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const query = useMemo(() => ({
    relativePath, search: activeSearch, sortBy: sortField, direction: sortDirection,
  }), [relativePath, activeSearch, sortField, sortDirection]);
  const queryKey = folderQueryKey(query);
  const fileInfo = useSelector((state: RootState) => state.fileExplorer.cache[queryKey]);
  const loading = useSelector((state: RootState) => state.fileExplorer.loading[queryKey]);
  const error = useSelector((state: RootState) => state.fileExplorer.errors[queryKey]);
  const isDebouncing = searchQuery.trim() !== activeSearch;
  const visibleFiles = isDebouncing ? [] : fileInfo?.files ?? [];

  const refresh = useCallback(() => {
    setSelectedPaths(new Set());
    const search = searchQuery.trim();
    setActiveSearch(search);
    dispatch(clearFileCache());
    void dispatch(fetchFolderPage({ ...query, search, offset: 0 }));
  }, [dispatch, query, searchQuery]);
  useEffect(() => {
    const onUpload = (event: Event) => {
      if ((event as CustomEvent<string>).detail === relativePath) refresh();
    };
    window.addEventListener("pocketspace:upload-complete", onUpload);
    window.addEventListener("pocketspace:download-complete", refresh);
    return () => {
      window.removeEventListener("pocketspace:upload-complete", onUpload);
      window.removeEventListener("pocketspace:download-complete", refresh);
    };
  }, [refresh, relativePath]);
  const createFolder = async () => {
    setSaving(true);
    try {
      await HttpService.getInstance().post<void>("/space/folders", { parentPath: relativePath, name: folderName });
      setCreating(false);
      setFolderName("");
      refresh();
    } catch {
      // The request layer displays the failure.
    } finally { setSaving(false); }
  };
  useEffect(() => {
    const timer = window.setTimeout(() => setActiveSearch(searchQuery.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedPaths(new Set());
    if (!isDebouncing) void dispatch(fetchFolderPage({ ...query, offset: 0 }));
  }, [dispatch, query, isDebouncing]);

  useEffect(() => {
    if (isDebouncing || !fileInfo?.hasMore || loading || error || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        void dispatch(fetchFolderPage({ ...query, offset: fileInfo.nextOffset }));
      }
    }, { rootMargin: "300px" });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [dispatch, query, fileInfo?.hasMore, fileInfo?.nextOffset, loading, error, isDebouncing]);

  const renderItem = (item: FileSystemEntry) => (
    <FileExplorerItem
      key={item.relativePath}
      item={item}
      viewMode={viewMode}
      selectionMode={selectionMode}
      selected={selectedPaths.has(item.relativePath)}
      onChanged={refresh}
      onToggleSelect={() => toggleSelection(item.relativePath)}
    />
  );
  const toggleSelection = (path: string) => {
    setSelectedPaths((prev) => {
      const updated = new Set(prev);
      if (updated.has(path)) {
        updated.delete(path);
      } else {
        updated.add(path);
      }
      return updated;
    });
  };

  const clearSelection = () => {
    setSelectedPaths(new Set());
  };
  const handleDownloadSelectedFiles = () => {
    const filePaths = Array.from(selectedPaths);
    if (filePaths.length === 0) {
      notification.warning({
        message: "No files to download",
        description: "Please select at least one file to download.",
      });
      return;
    }

    try {
      const selected = filePaths.length === 1 ? visibleFiles.find(item => item.relativePath === filePaths[0]) : undefined;
      transferManager.enqueueDownload(filePaths, selected?.isFolder ? `${selected.name}.zip`
        : selected?.name || (filePaths.length === 1 ? filePaths[0].split("/").pop() || "download" : `${filePaths.length} items`));
    } catch (error) {
      notification.error({ message: "Could not start download", description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  return (
    <div className="file-explorer">
      <UploadArea />
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
                disabled={selectedPaths.size === 0}
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

      {!isDebouncing && error && !fileInfo && <Alert type="error" showIcon message={error} action={
        <Button onClick={() => void dispatch(fetchFolderPage({ ...query, offset: 0 }))}>Retry</Button>
      } />}
      {(isDebouncing || (!fileInfo && !error)) && <Spin aria-label="Loading files" />}
      {!isDebouncing && !loading && !error && fileInfo?.totalCount === 0 && !activeSearch &&
        <Empty description="Your folder is empty. Upload a file to get started." />}
      {!isDebouncing && !loading && !error && fileInfo?.totalCount === 0 && !!activeSearch && (
        <Empty description="No matching names in this folder.">
          <Button onClick={() => setSearchQuery("")}>Clear search</Button>
        </Empty>
      )}
      <div className={viewMode == "grid" ? "grid" : "list"}>
        {visibleFiles.map(renderItem)}
      </div>
      {!isDebouncing && loading && fileInfo && <div className="file-loading-more"><Spin aria-label="Loading more files" /></div>}
      {!isDebouncing && error && fileInfo && <Alert type="error" showIcon message={error} action={
        <Button onClick={() => void dispatch(fetchFolderPage({ ...query, offset: fileInfo.nextOffset }))}>Retry</Button>
      } />}
      {!isDebouncing && fileInfo?.hasMore && <div ref={loadMoreRef} aria-hidden="true" className="file-load-more" />}
    </div>
  );
};

export default FileExplorer;
