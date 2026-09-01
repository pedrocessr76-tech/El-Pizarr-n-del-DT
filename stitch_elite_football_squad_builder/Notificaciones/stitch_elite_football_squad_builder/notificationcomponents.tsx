import React from 'react';
import { useNotificationStore, NotificationItem, NotificationType } from '../store/useNotificationStore';

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'goal': return 'sports_soccer';
    case 'match_end': return 'emoji_events';
    case 'round_advance': return 'trending_flat';
    case 'user_turn': return 'person';
    case 'change_requested': return 'published_with_changes';
    case 'tournament_start': return 'workspace_premium';
    case 'tournament_end': return 'military_tech';
    case 'achievement_unlocked': return 'celebration';
    case 'system_maintenance': return 'report';
    default: return 'notifications';
  }
};

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'success': return 'border-l-4 border-green-500 bg-green-500/10';
    case 'error': return 'border-l-4 border-red-500 bg-red-500/10';
    case 'warning': return 'border-l-4 border-amber-500 bg-amber-500/10';
    default: return 'border-l-4 border-blue-500 bg-blue-500/10';
  }
};

export const NotificationToast: React.FC<{ item: NotificationItem }> = ({ item }) => {
  const removeToast = useNotificationStore((state) => state.removeToast);

  React.useEffect(() => {
    const timer = setTimeout(() => removeToast(item.id), 5000);
    return () => clearTimeout(timer);
  }, [item.id, removeToast]);

  return (
    <div className={`flex items-start p-4 mb-3 w-80 rounded-xl shadow-2xl backdrop-blur-md border border-white/10 animate-in slide-in-from-right duration-300 ${getSeverityStyles(item.severity)}`}>
      <span className="material-symbols-outlined mr-3 text-2xl">
        {getIcon(item.type)}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="font-montserrat font-bold text-sm text-white mb-1 uppercase tracking-wider">
          {item.title}
        </h4>
        <p className="text-xs text-gray-300 line-clamp-2">
          {item.body}
        </p>
      </div>
      <button 
        onClick={() => removeToast(item.id)}
        className="ml-2 text-gray-400 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
};

export const NotificationPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { notifications, markAllAsRead, markAsRead } = useNotificationStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] md:inset-auto md:top-16 md:right-4 md:w-96">
      {/* Mobile Backdrop */}
      <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative h-full md:h-auto max-h-[80vh] flex flex-col bg-[#131b2e]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-montserrat font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications</span>
            Notificaciones
          </h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={markAllAsRead}
              className="text-[10px] text-primary hover:text-primary-light font-bold uppercase transition-colors"
            >
              Marcar todo leído
            </button>
            <button onClick={onClose} className="md:hidden text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">notifications_off</span>
              <p className="text-gray-400 font-montserrat text-sm">No tienes notificaciones pendientes</p>
              <p className="text-gray-600 text-xs mt-1">¡El campo te espera!</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div 
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`group relative p-4 mb-2 rounded-lg transition-all cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/5 ${!item.read ? 'bg-primary/5' : ''}`}
              >
                <div className="flex gap-4">
                  <div className={`p-2 rounded-lg bg-surface-bright flex items-center justify-center ${!item.read ? 'text-primary' : 'text-gray-500'}`}>
                    <span className="material-symbols-outlined">{getIcon(item.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm font-bold truncate ${!item.read ? 'text-white' : 'text-gray-400'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">hace 5m</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                  {!item.read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1 shadow-[0_0_8px_rgba(27,67,50,0.8)]" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-all active:scale-90"
        aria-label="Ver notificaciones"
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined text-2xl">
          {unreadCount > 0 ? 'notifications_active' : 'notifications'}
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-primary text-[#a5d0b9] text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0b1326] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};