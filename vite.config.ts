// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';

import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [react(),  svgr({ 
    svgrOptions: {
      // svgr options
    },
  }),],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "certs/localhost-key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "certs/localhost.pem")),
    },
    port: 5173,
    host: "localhost",
    watch: {
      usePolling: true
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          // '@primary-color': '#1DA57A', // example
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
