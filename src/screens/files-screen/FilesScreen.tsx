import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/app-layout/AppLayout";
import FileExplorer from "../../components/file-explorer/FileExplorer";
import { Breadcrumb, Divider } from "antd";
import { HomeOutlined } from "@ant-design/icons";

interface IFilesScreenProps {}

const FilesScreen: React.FC<IFilesScreenProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const relativePath = searchParams.get("path");

  const pathSegments = relativePath
    ? relativePath.replace(/^\.\//, "").split("/").filter(Boolean)
    : [];

  const handleBreadcrumbClick = (index: number) => {
    if (index === -2) {
      navigate("/");
    } else if (index === -1) {
      navigate("/files");
    } else {
      const partialPath = pathSegments.slice(0, index + 1).join("/");
      navigate(`/files?path=${encodeURIComponent(partialPath)}`);
    }
  };

  const breadcrumbItems = [
    {
      title: <HomeOutlined />,
      onClick: () => handleBreadcrumbClick(-2),
    },
    {
      title: "Files",
      onClick: () => handleBreadcrumbClick(-1),
    },
    ...pathSegments.map((segment, index) => ({
      title: segment,
      onClick: () => handleBreadcrumbClick(index),
    })),
  ];

  return (
    <AppLayout>
      <Breadcrumb items={breadcrumbItems} />
      <Divider style={{margin:"12px 0"}}/>
      <FileExplorer />
    </AppLayout>
  );
};

export default FilesScreen;
