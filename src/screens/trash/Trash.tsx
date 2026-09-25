import React, { useEffect, useState } from 'react';
import { Alert, App, Button, Card, Empty, Flex, List, Skeleton, Typography } from 'antd';
import { DeleteOutlined, FileOutlined, FolderOutlined, ReloadOutlined, UndoOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import AppLayout from '../../layouts/app-layout/AppLayout';
import FileService from '../../services/file-service';
import { formatBytes } from '../../services/util';
import { clearFileCache } from '../../store/features/fileExplorer/fileExplorerSlice';
import type { TrashEntry } from '../../types';

const Trash: React.FC = () => {
  const [items, setItems] = useState<TrashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(Date.now());
  const dispatch = useDispatch();
  const { notification } = App.useApp();
  const refresh = () => setRevision(value => value + 1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    FileService.getTrash()
      .then(data => { if (active) { setItems(data); setNow(Date.now()); } })
      .catch(failure => { if (active) setError(failure instanceof Error ? failure.message : 'Could not load Trash.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const restore = async (item: TrashEntry) => {
    setRestoring(item.id);
    try {
      await FileService.restore(item.id);
      dispatch(clearFileCache());
      notification.success({ message: `Restored ${item.name}`, description: 'This item is back in its original folder.' });
      refresh();
    } catch (failure) {
      notification.error({ message: 'Could not restore item', description: failure instanceof Error ? failure.message : 'Please try again.' });
    } finally { setRestoring(null); }
  };

  return <AppLayout>
    <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 20 }}>
      <Typography.Title level={2} style={{ margin: 0 }}><DeleteOutlined /> Trash</Typography.Title>
      <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>Refresh</Button>
    </Flex>
    <Alert type="info" showIcon message="Items in Trash are automatically deleted after seven days."
      description="Restore an item before its deletion date to return it to its original folder. Files in Trash do not appear in Favorites or Recent files."
      style={{ marginBottom: 20 }} />
    {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} action={<Button onClick={refresh}>Try again</Button>} />}
    <Card>
      {loading ? <Skeleton active /> : !error && <List dataSource={items}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Trash is empty" /> }}
        renderItem={item => {
          const expired = Date.parse(item.expiresAt) <= now;
          return <List.Item key={item.id}>
            <Flex align="center" justify="space-between" gap={16} wrap style={{ width: '100%' }}>
              <Flex gap={12} align="flex-start" style={{ minWidth: 0, flex: '1 1 240px' }}>
                {item.isFolder ? <FolderOutlined style={{ fontSize: 28 }} /> : <FileOutlined style={{ fontSize: 28 }} />}
                <div style={{ minWidth: 0 }}>
                  <Typography.Text strong style={{ overflowWrap: 'anywhere' }}>{item.name}</Typography.Text>
                  <div style={{ overflowWrap: 'anywhere' }}><Typography.Text type="secondary">{item.originalPath} · {formatBytes(item.size)}</Typography.Text></div>
                  <div><Typography.Text type="secondary">Trashed {new Date(item.trashedAt).toLocaleString()}</Typography.Text></div>
                  <div><Typography.Text type={expired ? 'danger' : 'secondary'}>
                    {expired ? 'Restore period ended · awaiting cleanup' : `Deletes ${new Date(item.expiresAt).toLocaleString()}`}
                  </Typography.Text></div>
                </div>
              </Flex>
              <Button icon={<UndoOutlined />} disabled={expired || restoring !== null} loading={restoring === item.id}
                aria-label={`Restore ${item.name}`} onClick={() => void restore(item)}>Restore</Button>
            </Flex>
          </List.Item>;
        }} />}
    </Card>
  </AppLayout>;
};

export default Trash;
