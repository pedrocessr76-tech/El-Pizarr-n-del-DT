import { create } from 'zustand';
import type { NotificationType, Severity, NotificationPayload } from '../../../../packages/shared/types/models';

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
  addNotification: (notification: NotificationPayload & { read?: boolean }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(7);

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  toasts: [],
  unreadCount: 0,

  addNotification: (data) => {
    const newNotification: NotificationItem = {
      ...data,
      id: genId(),
      timestamp: data.timestamp ?? Date.now(),
      read: data.read ?? false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      toasts: [...state.toasts, newNotification],
      unreadCount: newNotification.read ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) => n.id === id ? { ...n, read: true } : n);
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

/** Reexportamos los tipos para los componentes. */
export type { NotificationType, Severity } from '../../../../packages/shared/types/models';