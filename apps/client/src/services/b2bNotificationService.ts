import { b2bApi } from './b2bService';
import type { B2bNotificationPayload } from '../../../../packages/shared/types/models';

export interface B2bNotificationListResponse {
  items: B2bNotificationPayload[];
  unreadCount: number;
}

export const b2bNotificationService = {
  async list(): Promise<B2bNotificationListResponse> {
    const { data } = await b2bApi.get<B2bNotificationListResponse>('/v1/notifications');
    return data;
  },

  async markRead(id: string): Promise<void> {
    await b2bApi.post(`/v1/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await b2bApi.post('/v1/notifications/read-all');
  },

  async sendAnnouncement(input: { title: string; body: string; severity?: 'info' | 'success' | 'warning' | 'error' }): Promise<void> {
    await b2bApi.post('/v1/notifications', input);
  },
};