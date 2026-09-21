import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useB2bNotificationStore } from '../../store/useB2bNotificationStore';
import { b2bNotificationService } from '../../services/b2bNotificationService';
import { formatDistanceToNow } from '../../utils/time';

export function B2bNotificationBell() {
  const [open, setOpen] = useState(false);
  const panelsRef = useRef<HTMLDivElement>(null);
  const items = useB2bNotificationStore((state) => state.items);
  const unreadCount = useB2bNotificationStore((state) => state.unreadCount);
  const markAsRead = useB2bNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useB2bNotificationStore((state) => state.markAllAsRead);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (panelsRef.current && !panelsRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleTrigger = () => {
    if (!open && unreadCount > 0) {
      void b2bNotificationService.markAllRead().catch(() => undefined);
      markAllAsRead();
    }
    setOpen(!open);
  };

  const handleItemClick = (item: { id?: string; key: string }) => {
    markAsRead(item.key);
    if (item.id) void b2bNotificationService.markRead(item.id).catch(() => undefined);
  };

  return (
    <div className="b2b-notif-bell" ref={panelsRef}>
      <button className="icon-button" title="Notificaciones" onClick={handleTrigger} aria-label="Notificaciones">
        <Bell size={17} />
        {unreadCount > 0 && <span className="b2b-notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="panel b2b-notif-panel">
          <div className="panel-heading">
            <h2>Notificaciones</h2>
            {unreadCount > 0 && (
              <button
                className="b2b-notif-clear"
                onClick={() => {
                  void b2bNotificationService.markAllRead().catch(() => undefined);
                  markAllAsRead();
                }}
              >
                <CheckCheck size={13} /> Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="b2b-notif-list">
            {items.length === 0 && <div className="b2b-notif-empty">No tenés notificaciones.</div>}
            {items.slice(0, 30).map((item) => (
              <button
                key={item.key}
                className={`b2b-notif-item ${item.read ? 'is-read' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <span className={`b2b-notif-dot sev-${item.severity}`} />
                <span className="b2b-notif-body">
                  <strong>{item.title}</strong>
                  <small>{item.body}</small>
                  <em>{formatDistanceToNow(item.createdAt)}</em>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}