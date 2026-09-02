import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import type { NotificationPayload } from '../../../../packages/shared/types/models';
import { useAuthStore } from '../store/useAuthStore';
import { getGuestSessionId } from '../utils/session';

/**
 * Origen del servidor de socket.io (el backend NestJS), NO de la página estática.
 * - `VITE_WS_URL`: override explícito si se necesita un destino puntual.
 * - `VITE_API_URL`: en producción apunta al backend (el mismo servidor sirve socket.io).
 * - En dev (sin `VITE_API_URL`) usa el mismo origen: Vite proxya `/socket.io` al backend.
 */
const API_ORIGIN = import.meta.env.VITE_API_URL as string | undefined;
const SOCKET_URL =
  import.meta.env.VITE_WS_URL ||
  (API_ORIGIN && API_ORIGIN !== '/' ? API_ORIGIN : window.location.origin);

/**
 * Hook que suscribe a notificaciones en tiempo real vía WebSocket.
 *
 * - Usuario logueado: envía el JWT como `auth.token`.
 * - Invitado: envía `sessionId` por query.
 *
 * Debe montarse una única vez (ideal en App root). Recibe el evento
 * `notification` con un `NotificationPayload` y lo ingresa al store.
 *
 * Reacciona a los cambios de identidad para reconstruir la conexión:
 *  - Al iniciar/cerrar sesión (cambia `token` en el auth store).
 *  - Cuando se crea la sesión de invitado (evento `epdt:guest-session`), que
 *    normalmente ocurre después del mount inicial, al armar el equipo.
 */
export function useNotificationSocket() {
    const addNotification = useNotificationStore((s) => s.addNotification);
    // Reactivo al login/logout: un cambio de token re-crea el socket con la identidad correcta.
    const token = useAuthStore((s) => s.token);
    // La sesión de invitado se genera luego del mount (al crear el equipo),
    // así que escuchamos un evento custom para reconectar cuando aparezca.
    const [guestSessionRev, setGuestSessionRev] = useState(0);

    useEffect(() => {
        const onGuestSession = () => setGuestSessionRev((r) => r + 1);
        window.addEventListener('epdt:guest-session', onGuestSession);
        return () => window.removeEventListener('epdt:guest-session', onGuestSession);
    }, []);

    useEffect(() => {
        // Identidad vigente al momento de (re)conectar.
        const currentToken = useAuthStore.getState().token;
        const sessionId = getGuestSessionId();

        // Sin usuario ni sesión invitado el gateway rechaza la conexión, así que no conectamos.
        if (!currentToken && !sessionId) return;

        const wsOptions: Record<string, any> = {
            path: '/socket.io',
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        };

        // El gateway lee `auth.token` (JWT) o `query.sessionId`.
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
