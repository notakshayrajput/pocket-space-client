import React from 'react';
import AppLayout from '../../layouts/app-layout/AppLayout';
import DriveStatsPanel from '../../components/drive-stat-panel/DriveStatPanel';
import { Breadcrumb, Divider } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
const breadcrumbItems = [
  {
    title: <Link to="/"><HomeOutlined /></Link>,
  }
];

const Home: React.FC = () => {
  
  return (
    <AppLayout>
      <Breadcrumb items={breadcrumbItems} />
      <Divider style={{ margin: "12px 0" }} />
      <DriveStatsPanel />
    
    </AppLayout>
  );
};

export default Home;
