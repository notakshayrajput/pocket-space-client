import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import 'antd/dist/reset.css'; // Reset styles for antd 5+
import { ConfigProvider } from 'antd';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
    <ConfigProvider prefixCls="ps">
      <App />
    </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
