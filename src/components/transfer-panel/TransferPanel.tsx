import { useState, useSyncExternalStore } from "react";
import { Button, Progress } from "antd";
import { CloseOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import { useAuth } from "../../auth/auth-context";
import { transferManager, type TransferItem } from "../../services/transfer-manager";
import "./TransferPanel.css";

function progress(item: TransferItem) {
  if (item.status === "queued") return <div className="transfer-track"><div style={{ width: "0%" }} /></div>;
  if (item.percent === null && item.status === "active") return <div className="transfer-track transfer-indeterminate"><div /></div>;
  return <Progress percent={item.percent ?? 0} size="small" showInfo={false}
    status={item.status === "failed" ? "exception" : item.status === "completed" ? "success" : "active"} />;
}

function statusText(item: TransferItem): string {
  if (item.status === "queued") return "Waiting";
  if (item.status === "failed") return item.error || "Failed";
  if (item.status === "cancelled") return "Cancelled";
  if (item.status === "completed") return item.kind === "download" ? "Download started" : "Uploaded";
  if (item.percent === 100) return item.kind === "upload" ? "Saving on server…" : "Starting download…";
  if (item.percent === null) return item.kind === "download" ? "Preparing download…" : "Uploading…";
  return `${item.percent}%`;
}

export default function TransferPanel() {
  const { user } = useAuth();
  const items = useSyncExternalStore(transferManager.subscribe, transferManager.getSnapshot);
  const [expanded, setExpanded] = useState(false);
  if (!user || items.length === 0) return null;

  const allUploads = items.filter(item => item.kind === "upload");
  const activeBatchIds = new Set(allUploads.filter(item => item.status === "queued" || item.status === "active").map(item => item.batchId));
  const latestBatchId = allUploads.at(-1)?.batchId;
  const uploads = allUploads.filter(item => activeBatchIds.size ? activeBatchIds.has(item.batchId) : item.batchId === latestBatchId);
  const completedUploads = uploads.filter(item => item.status === "completed").length;
  const cancelledUploads = uploads.filter(item => item.status === "cancelled").length;
  const failedUploads = uploads.filter(item => item.status === "failed").length;
  const activeDownloads = items.filter(item => item.kind === "download" && item.status === "active").length;
  const finishedDownloads = items.filter(item => item.kind === "download" && item.status === "completed").length;
  const failedDownloads = items.filter(item => item.kind === "download" && item.status === "failed").length;
  const hasActive = items.some(item => item.status === "queued" || item.status === "active");
  const overall = uploads.length ? Math.round(uploads.reduce((sum, item) => sum +
    (item.status === "completed" || item.status === "cancelled" || item.status === "failed" ? 100 : item.percent ?? 0), 0) / uploads.length) : null;
  const summary = [uploads.length ? `${completedUploads} of ${uploads.length} uploaded` : "Transfers",
    cancelledUploads ? `${cancelledUploads} cancelled` : "",
    failedUploads ? `${failedUploads} failed` : "",
    activeDownloads ? `${activeDownloads} downloading` : "",
    finishedDownloads ? `${finishedDownloads} download started` : "",
    failedDownloads ? `${failedDownloads} download failed` : ""].filter(Boolean).join(" · ");

  return <section className={`transfer-panel ${expanded ? "expanded" : ""}`} aria-label="File transfers">
    <button className="transfer-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
      <span><strong>File transfers</strong><small>{summary}</small></span>
      {expanded ? <DownOutlined /> : <UpOutlined />}
    </button>
    {uploads.length > 0 && <div className="transfer-overall" aria-label={`Overall upload progress ${overall}%`}>
      <Progress percent={overall ?? 0} showInfo={false} size="small" status={failedUploads ? "exception" : hasActive ? "active" : "normal"} />
    </div>}
    {!uploads.length && hasActive && <div className="transfer-overall"><div className="transfer-track transfer-indeterminate"><div /></div></div>}
    {expanded && <>
      <div className="transfer-list">
        {items.map(item => <div className="transfer-row" key={item.id}>
          <div className="transfer-row-heading">
            <span title={item.name}>{item.name}</span>
            {(item.status === "queued" || item.status === "active" && (item.kind === "download" || item.percent !== 100)) && <Button type="text" size="small" danger
              aria-label={`Cancel ${item.kind} ${item.name}`} title="Cancel transfer" icon={<CloseOutlined />}
              onClick={() => transferManager.cancel(item.id)} />}
          </div>
          {progress(item)}
          <div className={`transfer-status ${item.status}`}>{statusText(item)}</div>
        </div>)}
      </div>
      {items.some(item => item.status === "completed" || item.status === "failed" || item.status === "cancelled") &&
        <Button size="small" type="link" onClick={() => transferManager.clearFinished()}>Clear finished</Button>}
    </>}
  </section>;
}
