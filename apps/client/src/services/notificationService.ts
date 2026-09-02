import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import type { NotificationPayload } from '../../../../packages/shared/types/models';
import { useAuthStore } from '../store/useAuthStore';
import { getGuestSessionId } from '../utils/session';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
const WS_URL = import.meta.env.VITE_WS_URL as string | undefined;

/**
 * Resuelve el origen del servidor de socket.io (el backend NestJS), NO de la página estática.
 * - VITE_WS_URL / VITE_API_URL: destino explícito (en producción apunta a la API).
 * - En dev (sin variables): mismo origen — Vite proxya /socket.io al backend.
 * - En producción sin variables: deriva el host de la API por convención de Render
 *   (el-pizarron-web -> el-pizarron-api en el mismo dominio .onrender.com).
 * - Si no hay destino válido devuelve null (no conectamos, evitando errores de WS).
 */
function resolveSocketUrl(): string | null {
    if (WS_URL) return WS_URL;
    if (API_URL && API_URL !== '/') return API_URL;
    if (import.meta.env.DEV) return window.location.origin;
    const hostname = window.location.hostname;
    if (hostname.startsWith('el-pizarron-web')) {
        return window.location.protocol + '//' + hostname.replace('el-pizarron-web', 'el-pizarron-api');
    }
    return null;
}

const SOCKET_URL = resolveSocketUrl();

/**
 * Hook que suscribe a notificaciones en tiempo real vía WebSocket.
 *
 * - Usuario logueado: envía el JWT como auth.token.
 * - Invitado: envía sessionId por query.
 *
 * Debe montarse una única vez (ideal en App root). Recibe el evento
 * notification con un NotificationPayload y lo ingresa al store.
 */
export function useNotificationSocket() {
    const addNotification = useNotificationStore((s) => s.addNotification);
    const token = useAuthStore((s) => s.token);
    const [guestSessionRev, setGuestSessionRev] = useState(0);

    useEffect(() => {
        const onGuestSession = () => setGuestSessionRev((r) => r + 1);
        window.addEventListener('epdt:guest-session', onGuestSession);
        return () => window.removeEventListener('epdt:guest-session', onGuestSession);
    }, []);

    useEffect(() => {
        if (!SOCKET_URL) return;

        const currentToken = useAuthStore.getState().token;
        const sessionId = getGuestSessionId();

        if (!currentToken && !sessionId) return;

        const wsOptions: Record<string, any> = {
            path: '/socket.io',
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        };

        if (currentToken) {
            wsOptions.auth = { token: currentToken };
        } else if (sessionId) {
            wsOptions.query = { sessionId };
        }

        const s = io(SOCKET_URL, wsOptions) as Socket;

        s.on('notification', (payload: NotificationPayload) => {
            addNotification({
                type: payload.type,
                severity: payload.severity,
                title: payload.title,
                body: payload.body,
                timestamp: payload.timestamp,
                metadata: payload.metadata,
            });
        });

        s.on('connect_error', (err: any) => {
            console.warn('[socket.io] Error de conexión de notificaciones:', err?.message);
        });

        return () => {
            s.disconnect();
        };
    }, [addNotification, token, guestSessionRev]);
}
