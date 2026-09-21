import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';
import { useB2bStore } from '../store/useB2bStore';
import { useB2bNotificationStore } from '../store/useB2bNotificationStore';
import { b2bNotificationService } from './b2bNotificationService';
import type { B2bNotificationPayload } from '../../../../packages/shared/types/models';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
const WS_URL = import.meta.env.VITE_WS_URL as string | undefined;

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
 * Suscribe al canal B2B en tiempo real.
 *
 * - Logueado con token B2B: envía el JWT como auth.token dentro del NAMESPACE
 *   `/b2b` (mismo servidor socket.io que el juego, pero aislado: el gateway del
 *   juego no valida tokens B2B y los cortaría si compartieran namespace).
 * - Al conectar (y reconectar) hidrata el historial persistido desde la API REST.
 * - Recibe `notification` con un B2bNotificationPayload y lo ingresa al store,
 *   deduplicando por clave de contenido (los eventos del canal del complejo llegan
 *   sin id, los del canal personal llevan el id propio).
 */
export function useB2bNotificationSocket() {
    const token = useB2bStore((state) => state.token);
    const upsertFromSocket = useB2bNotificationStore((state) => state.upsertFromSocket);
    const setItems = useB2bNotificationStore((state) => state.setItems);
    const reset = useB2bNotificationStore((state) => state.reset);

    useEffect(() => {
        if (!token) {
            reset();
            return;
        }
        if (!SOCKET_URL) return;

        const s = io(SOCKET_URL + '/b2b', {
            path: '/socket.io',
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            auth: { token },
        }) as Socket;

        const hydrate = async () => {
            try {
                const { items } = await b2bNotificationService.list();
                setItems(items);
            } catch (err) {
                console.warn('[b2b/socket] No se pudo hidratar el historial de notificaciones:', err);
            }
        };

        s.on('connect', () => void hydrate());

        s.on('notification', (payload: B2bNotificationPayload) => {
            upsertFromSocket(payload);
        });

        s.on('connect_error', (err: any) => {
            console.warn('[b2b/socket] Error de conexión de notificaciones:', err?.message);
        });

        return () => {
            s.disconnect();
        };
    }, [token, setItems, upsertFromSocket, reset]);
}