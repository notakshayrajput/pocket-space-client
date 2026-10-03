import React, { useRef, useState } from "react";
import { Flex, Button, List, message } from "antd";
import { PlusOutlined, UploadOutlined, CloseOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import "./UploadArea.css";
import { transferManager } from "../../services/transfer-manager";

const UploadArea: React.FC = () => {
  const [searchParams] = useSearchParams();
  const destinationPath = searchParams.get("path") || "";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
    e.target.value = "";
  };

  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = () => {
    if (!selectedFiles.length) {
      message.warning("Please select files first.");
      return;
    }

    try {
      transferManager.enqueueUploads(selectedFiles, destinationPath);
      setSelectedFiles([]);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Could not start upload.");
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
          onClick={handleUpload}
        >
          Upload
        </Button>
      )}
    </Flex>
  );
};

export default UploadArea;
