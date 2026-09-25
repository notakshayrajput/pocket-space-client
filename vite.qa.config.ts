import base from './vite.config';
export default { ...base, server: { ...base.server, port: 5174, proxy: { '/api': { target: 'http://localhost:5018', changeOrigin: true }, '/ws': { target: 'ws://localhost:5018', ws: true } } } };
