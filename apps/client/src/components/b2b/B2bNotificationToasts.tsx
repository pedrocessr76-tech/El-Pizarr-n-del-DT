import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useB2bNotificationStore } from '../../store/useB2bNotificationStore';

/**
 * Toasts transitorios para notificaciones B2B en tiempo real.
 * Se auto-descartan a los 6 segundos; clic en la X los cierra.
 */
export function B2bNotificationToasts() {
  const toasts = useB2bNotificationStore((state) => state.toasts);
  const dismissToast = useB2bNotificationStore((state) => state.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) => {
      const timeout = 6000;
      const timer = window.setTimeout(() => dismissToast(toast.key), timeout);
      return { key: toast.key, timer };
    });
    return () => timers.forEach(({ timer }) => window.clearTimeout(timer));
  }, [toasts, dismissToast]);

  if (!toasts.length) return null;

  return (
    <div className="b2b-toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.key} className={`b2b-toast sev-${toast.severity}`}>
          <span className={`b2b-notif-dot sev-${toast.severity}`} />
          <span className="b2b-toast-body">
            <strong>{toast.title}</strong>
            <small>{toast.body}</small>
          </span>
          <button className="b2b-toast-close" onClick={() => dismissToast(toast.key)} aria-label="Cerrar">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}