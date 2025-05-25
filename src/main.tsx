import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import 'antd/dist/reset.css'; 
import { ConfigProvider,notification, App as AntdApp } from 'antd';


ReactDOM.createRoot(document.getElementById('root')!).render(
  
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        prefixCls="ps"
      >
        <AntdApp notification={{stack:{ threshold: 5 }}}> 
          <App />
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
