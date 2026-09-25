import React, { useRef, useState } from "react";
import { Flex, Button, List, message } from "antd";
import { PlusOutlined, UploadOutlined, CloseOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import "./UploadArea.css";
import UploadService from "../../services/upload-service";

const UploadArea: React.FC<{ onUploaded: () => void }> = ({ onUploaded }) => {
  const [searchParams] = useSearchParams();
  const destinationPath = searchParams.get("path") || "";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      message.warning("Please select files first.");
      return;
    }

    setUploading(true);
    try {
      console.log("Uploading files:", selectedFiles, "to path:", destinationPath);
      const response = await UploadService.uploadFiles(selectedFiles, destinationPath);
      if (response.ok) {
        message.success("Files uploaded successfully.");
        setSelectedFiles([]);
        onUploaded();
      } else {
        const text = await response.text();
        message.error(`Upload failed: ${text}`);
      }
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Flex vertical gap="middle" style={{marginBottom:"20px"}}>
      {/* Upload Area */}
      <Flex
        className="upload-area"
        align="center"
        justify="center"
        vertical
        onClick={handleAreaClick}
        onDrop={handleDrop}
        onDragOver={preventDefaults}
        onDragEnter={preventDefaults}
        onDragLeave={preventDefaults}
      >
        <PlusOutlined style={{ fontSize: "24px" }} />
        <div>Click or drag files here to upload</div>
      </Flex>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* File List with Remove Option */}
      {selectedFiles.length > 0 && (
        <List
          bordered
          header={<strong>Files to upload:</strong>}
          dataSource={selectedFiles}
          renderItem={(file, index) => (
            <List.Item
              actions={[
                <Button
                  key="remove"
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => handleRemoveFile(index)}
                  danger
                  size="small"
                />,
              ]}
            >
              {file.name}
            </List.Item>
          )}
        />
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <Button
          type="primary"
          icon={<UploadOutlined />}
          disabled={!selectedFiles.length}
          loading={uploading}
          onClick={handleUpload}
        >
          Upload
        </Button>
      )}
    </Flex>
  );
};

export default UploadArea;
