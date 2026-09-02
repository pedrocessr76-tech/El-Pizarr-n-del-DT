import React from 'react';
import { useNotificationStore, NotificationItem, NotificationType, Severity } from '../store/useNotificationStore';
import { formatDistanceToNow } from '../utils/time';

const ICON_BY_TYPE: Record<NotificationType, string> = {
  goal: 'sports_soccer',
  match_end: 'emoji_events',
  round_advance: 'trending_flat',
  user_turn: 'person',
  change_requested: 'published_with_changes',
  tournament_start: 'workspace_premium',
  tournament_end: 'military_tech',
  achievement_unlocked: 'celebration',
  system_maintenance: 'report',
};

const SEVERITY_DOT: Record<Severity, string> = {
  success: 'bg-[#a5d0b9] shadow-[0_0_6px_rgba(165,208,185,0.8)]',
  error: 'bg-[#ffb4ab] shadow-[0_0_6px_rgba(255,180,171,0.8)]',
  warning: 'bg-[#e9c349] shadow-[0_0_6px_rgba(233,195,73,0.8)]',
  info: 'bg-[#a5d0b9] shadow-[0_0_6px_rgba(165,208,185,0.8)]',
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, markAllAsRead, markAsRead, clearAll } = useNotificationStore();
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const grouped = filtered.reduce(
    (acc, item) => {
      const d = new Date(item.timestamp);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
            const key = diff < 86400000 ? 'Hoy' : diff < 172800000 ? 'Ayer' : d.toLocaleDateString('es-AR', { dateStyle: 'medium' });
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, NotificationItem[]>,
  );

    return (
    <div
      className="fixed inset-0 z-[60] md:inset-auto md:top-16 md:right-4 md:w-96"
      role="dialog"
      aria-label="Centro de notificaciones"
    >
      {/* Backdrop: clic fuera para cerrar (también en desktop) */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative h-full md:h-auto max-h-[80vh] flex flex-col bg-[#131b2e]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-montserrat font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications</span>
            Notificaciones
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#1b4332] rounded-lg p-1 text-xs">
              {(['all', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1 rounded font-medium transition-all ${
                    filter === f
                      ? 'bg-primary text-[#0b1326]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Todas' : 'No leídas'}
                </button>
              ))}
            </div>
            <button
              onClick={markAllAsRead}
              disabled={notifications.every((n) => n.read)}
              className="text-[10px] text-primary hover:text-[#a5d0b9] font-bold uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Marcar todo leído
            </button>
            <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors" aria-label="Cerrar notificaciones">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Listado agrupado */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 pb-16 md:pb-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">notifications_off</span>
              <p className="text-gray-400 font-montserrat text-sm">
                {filter === 'unread'
                  ? 'No tienes notificaciones pendientes'
                  : 'Aún no tienes notificaciones'}
              </p>
              <p className="text-gray-600 text-xs mt-1">¡El campo te espera!</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <h4 className="px-3 py-2 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  {group}
                </h4>
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className="group relative p-3 mb-2 rounded-lg transition-all cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/5"
                  >
                    <div className="flex gap-3 items-start">
                      <div
                        className={`p-1.5 rounded-lg bg-surface-bright flex items-center justify-center text-lg ${
                          !item.read ? 'text-primary' : 'text-gray-500'
                        }`}
                      >
                        <span className="material-symbols-outlined">{ICON_BY_TYPE[item.type] ?? 'notifications'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4
                            className={`font-bold text-sm truncate ${
                              !item.read ? 'text-white' : 'text-gray-400'
                            }`}
                          >
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                            {formatDistanceToNow(item.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mt-0.5">
                          {item.body}
                        </p>
                        {!item.read && <span className={`absolute top-4 right-3 w-2 h-2 rounded-full ${SEVERITY_DOT[item.severity ?? 'info']}`} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer con acción borrar todo */}
        {filtered.length > 0 && (
          <div className="p-2 border-t border-white/10">
            <button
              onClick={clearAll}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-montserrat"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Limpiar historial
            </button>
          </div>
        )}
      </div>
    </div>
  );
};