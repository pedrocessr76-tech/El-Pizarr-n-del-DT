import React, { useEffect, useState } from 'react';
import { useNotificationStore, NotificationItem } from '../store/useNotificationStore';

type Severity = NotificationItem['severity'];

const SEVERITY_COLORS: Record<Severity, string> = {
  success: 'border-[#a5d0b9] bg-[#1b4332]/90',
  error: 'border-[#ffb4ab] bg-[#93000a]/90',
  warning: 'border-[#e9c349] bg-[#4e3d00]/90',
  info: 'border-[#a5d0b9] bg-[#0b1326]/90',
};

const ICON_BY_TYPE: Record<NonNullable<NotificationItem['type']>, string> = {
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

export const NotificationToast: React.FC<{ item: NotificationItem }> = ({ item }) => {
  const removeToast = useNotificationStore((s) => s.removeToast);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setExiting(true);
      // Tiempo suficiente para que termine la animación de salida antes de remover
      setTimeout(() => removeToast(item.id), 400);
    }, 4500);
    return () => clearTimeout(t);
  }, [item.id, removeToast]);

  const colorClass = SEVERITY_COLORS[item.severity ?? 'info'];

    return (
    <div
      className={`
        relative flex items-start gap-3 w-80 px-4 py-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.45)]
        backdrop-blur-md border border-white/10 text-[#dae2fd]
        transition-all duration-300
        ${colorClass}
        ${exiting ? 'animate-out slide-out-to-right-full' : 'animate-in slide-in-from-right-full'}
      `}
      role="status"
      aria-live="polite"
    >
      <span className="material-symbols-outlined text-2xl leading-tight mt-0.5 flex-shrink-0 text-primary">
        {ICON_BY_TYPE[item.type] ?? 'notifications'}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="font-montserrat font-bold text-sm text-white uppercase tracking-wider mb-0.5">
          {item.title}
        </h4>
        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
          {item.body}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          setExiting(true);
          setTimeout(() => removeToast(item.id), 400);
        }}
        className="ml-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
        aria-label="Cerrar"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>

      {/* Barra de progreso de auto-descarte */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-white/30 rounded-b-xl overflow-hidden">
        <div
          className="h-full bg-primary"
          style={{ width: '100%', animation: 'countdown 4.5s linear forwards' }}
        />
      </div>
    </div>
  );
};
