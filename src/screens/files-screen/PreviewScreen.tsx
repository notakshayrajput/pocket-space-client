import { Button, Flex, Typography } from "antd";
import { ArrowLeftOutlined, DownloadOutlined, ExportOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "../../layouts/app-layout/AppLayout";
import FilePreview from "../../components/file-explorer/FilePreview";
import { openPreviewTab } from "../../services/preview-service";
import { transferManager } from "../../services/transfer-manager";
import "../../components/file-explorer/FileExplorer.css";

export default function PreviewScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const path = params.get("path") || "";
  const parts = path.split("/");
  const name = parts.pop() || "File";
  const parent = parts.join("/") || ".";
  const file = { name, relativePath: path };
  return <AppLayout>
    <Flex className="preview-page-heading" justify="space-between" align="center" wrap gap={12}>
      <Flex align="center" gap={8}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/files?path=${encodeURIComponent(parent)}`)}>Files</Button>
        <Typography.Title level={3} style={{ margin: 0 }} ellipsis={{ tooltip: name }}>{name}</Typography.Title>
      </Flex>
      <Flex gap={8}>
        <Button icon={<ExportOutlined />} onClick={() => openPreviewTab(path)}>New tab</Button>
        <Button icon={<DownloadOutlined />} onClick={() => transferManager.enqueueDownload([path], name)}>Download</Button>
      </Flex>
    </Flex>
    {path ? <FilePreview file={file} /> : <Typography.Text>Select a file to preview.</Typography.Text>}
  </AppLayout>;
}
