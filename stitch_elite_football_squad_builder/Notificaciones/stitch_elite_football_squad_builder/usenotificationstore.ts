import { create } from 'zustand';

export type NotificationType = 
  | 'goal' 
  | 'match_end' 
  | 'round_advance' 
  | 'user_turn' 
  | 'change_requested' 
  | 'tournament_start' 
  | 'tournament_end' 
  | 'achievement_unlocked' 
  | 'system_maintenance';

export type Severity = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  severity: Severity;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  metadata?: Record<string, any>;
}

interface NotificationState {
  notifications: NotificationItem[];
  toasts: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  toasts: [],
  unreadCount: 0,

  addNotification: (data) => {
    const newNotification: NotificationItem = {
      ...data,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      read: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      toasts: [...state.toasts, newNotification],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      const newUnreadCount = updated.filter((n) => !n.read).length;
      return { notifications: updated, unreadCount: newUnreadCount };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => set({ notifications: [], toasts: [], unreadCount: 0 }),
}));