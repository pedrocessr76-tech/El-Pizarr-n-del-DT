import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const target = process.env.VITE_PROXY_TARGET || (process.env.DOCKER_ENV ? 'http://server:3001' : 'http://localhost:3001');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/draft': {
        target,
        changeOrigin: true,
        secure: false,
      },
      '/match': {
        target,
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target,
        changeOrigin: true,
        secure: false,
      },
      '/player': {
        target,
        changeOrigin: true,
        secure: false,
      },
      '/team': {
        target,
        changeOrigin: true,
        secure: false,
      },
      '/user': {
        target,
        changeOrigin: true,
        secure: false,
      },
      '/seed': {
        target,
        changeOrigin: true,
        secure: false,
      },
      '/docs': {
        target,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
