import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
var target = process.env.VITE_PROXY_TARGET || (process.env.DOCKER_ENV ? 'http://server:3001' : 'http://localhost:3001');
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'prompt',
            injectRegister: false,
            strategies: 'generateSW',
            includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-512x512-maskable.png', 'apple-touch-icon.png'],
            manifest: {
                name: 'El Pizarrón del DT',
                short_name: 'Pizarrón DT',
                description: 'Construye tu equipo de fútbol, abre sobres y compite en torneos de eliminación directa. Sistema Canchas incluido.',
                id: '/',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                orientation: 'portrait',
                theme_color: '#0b1326',
                background_color: '#0b1326',
                lang: 'es-AR',
                categories: ['games', 'sports', 'utilities'],
                icons: [
                    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'pwa-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,jpg}'],
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/, /^\/docs/, /^\/auth/, /^\/draft/, /^\/match/],
                maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
                cleanupOutdatedCaches: true,
            },
            devOptions: {
                enabled: false,
            },
        }),
    ],
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
            '/socket.io': {
                target: target,
                changeOrigin: true,
                secure: false,
                ws: true,
            },
            '/api': {
                target: target,
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
