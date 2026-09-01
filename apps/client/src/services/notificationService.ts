import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import type { NotificationPayload } from '../../../../packages/shared/types/models';
import { useAuthStore } from '../store/useAuthStore';
import { getGuestSessionId } from '../utils/session';

const SOCKET_URL = import.meta.env.VITE_WS_URL || window.location.origin;

/**
 * Hook que suscribe a notificaciones en tiempo real vía WebSocket.
 *
 * - Usuario logueado: envía el JWT como `auth.token`.
 * - Invitado: envía `sessionId` por query.
 *
 * Debe montarse una única vez (ideal en App root). Recibe el evento
 * `notification` con un `NotificationPayload` y lo ingresa al store.
 */
export function useNotificationSocket() {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    const sessionId = getGuestSessionId();

    const wsOptions: Record<string, any> = {
      path: '/socket.io',
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    };

    // El gateway lee `auth.token` (JWT) o `query.sessionId`
    if (token) {
      wsOptions.auth = { token };
    } else if (sessionId) {
      wsOptions.query = { sessionId };
    }

    const s = io(SOCKET_URL, wsOptions) as Socket;
    socketRef.current = s;

    s.on('connect', () => {
      // Reconectar con credenciales vigentes en reconexiones dinámicas
      const currentToken = useAuthStore.getState().token;
      if (currentToken && (s.auth as any)?.token !== currentToken) {
        s.auth = { token: currentToken };
      }
    });

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
      socketRef.current = null;
    };
  }, [addNotification]);
}
