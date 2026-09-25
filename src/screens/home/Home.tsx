import React, { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout/AppLayout';
import DriveStatsPanel from '../../components/drive-stat-panel/DriveStatPanel';
import { Alert, Button, Card, Empty, Flex, Skeleton, Typography } from 'antd';
import { ClockCircleOutlined, FolderOpenOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import FileExplorerItem from '../../components/file-explorer/FileExplorerItem';
import FileService from '../../services/file-service';
import { clearFileCache } from '../../store/features/fileExplorer/fileExplorerSlice';
import type { HomeFiles } from '../../types';
import '../../components/file-explorer/FileExplorer.css';
import './Home.css';

const Home: React.FC = () => {
  const [files, setFiles] = useState<HomeFiles>({ favorites: [], recent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const dispatch = useDispatch();
  const refresh = () => { dispatch(clearFileCache()); setRevision(value => value + 1); };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    FileService.getHome()
      .then(data => { if (active) setFiles(data); })
      .catch(failure => { if (active) setError(failure instanceof Error ? failure.message : 'Could not load your files.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);

  return (
    <AppLayout>
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 24 }}>
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>Home</Typography.Title>
          <Typography.Text type="secondary">Your favorites and the files you used recently, all in one place.</Typography.Text>
        </div>
        <Flex gap={8}>
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>Refresh</Button>
          <Link to="/files"><Button type="primary" icon={<FolderOpenOutlined />}>Browse files</Button></Link>
        </Flex>
      </Flex>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }}
        action={<Button onClick={refresh}>Try again</Button>} />}
      <div className="home-collections">
        <Card title={<><StarFilled style={{ color: '#ad6800', marginRight: 8 }} />Favorites</>}>
          <Typography.Paragraph type="secondary">Star a file in Files to keep it close.</Typography.Paragraph>
          {loading ? <Skeleton active /> : !error && (files.favorites.length ? <div className="home-file-list">
            {files.favorites.map(item => <FileExplorerItem key={item.id} item={item} viewMode="list" showLocation onChanged={refresh} />)}
          </div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No favorites yet" />)}
        </Card>
        <Card title={<><ClockCircleOutlined style={{ marginRight: 8 }} />Recent files</>}>
          <Typography.Paragraph type="secondary">Your 20 most recent uploads, downloads, renames, and restores.</Typography.Paragraph>
          {loading ? <Skeleton active /> : !error && (files.recent.length ? <div className="home-file-list">
            {files.recent.map(item => <FileExplorerItem key={item.id} item={item} viewMode="list" showLocation onChanged={refresh} />)}
          </div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Upload a file to get started">
            <Link to="/files"><Button>Go to Files</Button></Link>
          </Empty>)}
        </Card>
      </div>
      <div style={{ marginTop: 24 }}><DriveStatsPanel /></div>
    </AppLayout>
  );
};

export default Home;
