import React from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { NotificationPanel } from './NotificationPanel';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-gray-400 hover:text-white transition-all active:scale-90 rounded-xl hover:bg-white/5"
        aria-label="Ver notificaciones"
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined text-2xl">
          {unreadCount > 0 ? 'notifications_active' : 'notifications'}
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#93000a] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0b1326] animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};
