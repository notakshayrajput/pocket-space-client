import React, { useState } from 'react';
import AppLayout from '../../layouts/app-layout/AppLayout';
import DriveStatsPanel from '../../components/drive-stat-panel/DriveStatPanel';
import { Breadcrumb, Button, Divider } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import DownloadService from '../../services/download-service';
import { downloadFile } from '../../services/util';

const breadcrumbItems = [
  {
    title: <Link to="/"><HomeOutlined /></Link>,
  }
];

const Home: React.FC = () => {
   const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    const filePath = "./Motor.png";
    setLoading(true);
    try {
      await downloadFile([filePath]);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download the file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Breadcrumb items={breadcrumbItems} />
      <Divider style={{ margin: "12px 0" }} />
      <DriveStatsPanel />
      <div className="container">
        <h1>Download Large File</h1>
        <Button id="downloadBtn" onClick={handleDownload} disabled={loading}>
          {loading ? 'Downloading...' : 'Download Motor.png'}
        </Button>
        {loading && <div className="loading" id="loading">Downloading...</div>}
      </div>
    </AppLayout>
  );
};

export default Home;
