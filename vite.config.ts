// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';

import path from 'path';

export default defineConfig({
  plugins: [react(),  svgr({ 
    svgrOptions: {
      // svgr options
    },
  }),],
  server: {
    port: 5173,
    strictPort: true,
    host: "localhost",
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5008',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:5008',
        ws: true,
      },
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
