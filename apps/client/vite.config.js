import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
var target = process.env.VITE_PROXY_TARGET || (process.env.DOCKER_ENV ? 'http://server:3001' : 'http://localhost:3001');
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
            '/draft': {
                target: target,
                changeOrigin: true,
                secure: false,
            },
            '/match': {
                target: target,
                changeOrigin: true,
                secure: false,
            },
            '/auth': {
                target: target,
                changeOrigin: true,
                secure: false,
            },
            '/player': {
                target: target,
                changeOrigin: true,
                secure: false,
            },
            '/team': {
                target: target,
                changeOrigin: true,
                secure: false,
            },
            '/user': {
                target: target,
                changeOrigin: true,
                secure: false,
            },
            '/seed': {
                target: target,
                changeOrigin: true,
                secure: false,
            },
            '/docs': {
                target: target,
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
