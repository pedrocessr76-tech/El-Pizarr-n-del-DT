import { create } from 'zustand';
import type {
  NotificationType,
  Severity,
  B2bNotificationPayload,
} from '../../../../packages/shared/types/models';

export interface B2bNotificationItem {
  key: string;
  id?: string;
  type: NotificationType;
  severity: Severity;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: number;
}

export interface B2bNotificationToast {
  key: string;
  severity: Severity;
  title: string;
  body: string;
}

export const contentKeyOf = (type: string, severity: string, title: string, body: string) =>
  `${type}|${severity}|${title}|${body}`;

export function notificationToItem(payload: B2bNotificationPayload): B2bNotificationItem {
  return {
    key: contentKeyOf(payload.type, payload.severity, payload.title, payload.body),
    id: payload.id,
    type: payload.type,
    severity: payload.severity,
    title: payload.title,
    body: payload.body,
    metadata: payload.metadata,
    read: payload.read,
    createdAt: payload.createdAt ? Date.parse(payload.createdAt) : payload.timestamp,
  };
}

interface B2bNotificationState {
  items: B2bNotificationItem[];
  unreadCount: number;
  hydrated: boolean;
  toasts: B2bNotificationToast[];
  setItems: (payloads: B2bNotificationPayload[]) => void;
  upsertFromSocket: (payload: B2bNotificationPayload) => void;
  markAsRead: (key: string) => void;
  markAllAsRead: () => void;
  dismissToast: (key: string) => void;
  reset: () => void;
}

export const useB2bNotificationStore = create<B2bNotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  hydrated: false,
  toasts: [],

  setItems: (payloads) => {
    const items = payloads.map(notificationToItem);
    set({
      items,
      unreadCount: items.filter((item) => !item.read).length,
      hydrated: true,
    });
  },

  upsertFromSocket: (payload) => {
    const item = notificationToItem(payload);
    const { items } = get();
    const index = items.findIndex((existing) => existing.key === item.key);
    let updated: B2bNotificationItem[];
    if (index >= 0) {
      const existing = items[index];
      updated = [...items];
      updated[index] = {
        ...existing,
        ...item,
        read: payload.read ?? existing.read,
      };
    } else {
      updated = [item, ...items];
    }
    set({ items: updated, unreadCount: updated.filter((entry) => !entry.read).length });
    if (!item.read) {
      set({
        toasts: [...get().toasts, {
          key: item.key,
          severity: item.severity,
          title: item.title,
          body: item.body,
        }],
      });
    }
  },

  markAsRead: (key) => {
    const updated = get().items.map((item) => (item.key === key ? { ...item, read: true } : item));
    set({ items: updated, unreadCount: updated.filter((entry) => !entry.read).length });
  },

  markAllAsRead: () => {
    set({
      items: get().items.map((item) => ({ ...item, read: true })),
      unreadCount: 0,
    });
  },

  dismissToast: (key) => {
    set({ toasts: get().toasts.filter((toast) => toast.key !== key) });
  },

  reset: () => {
    set({ items: [], unreadCount: 0, hydrated: false, toasts: [] });
  },
}));