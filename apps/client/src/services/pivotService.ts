import { api } from './api';

export type PivotRole = 'GOALKEEPER' | 'FIELD' | 'BOTH';
export interface PivotProfile { available: boolean; role: PivotRole; positions: string[] }
export interface PivotPlayer { userId: string; username: string; role: PivotRole; positions: string[] }

export const pivotService = {
  async getMyProfile() {
    const { data } = await api.get<PivotProfile>('/pivots/me');
    return data;
  },
  async updateMyProfile(profile: Partial<PivotProfile>) {
    const { data } = await api.patch<PivotProfile>('/pivots/me', profile);
    return data;
  },
  async list(position?: string) {
    const { data } = await api.get<PivotPlayer[]>('/pivots', { params: position ? { position } : {} });
    return data;
  },
  async contact(userId: string, message: string) {
    const { data } = await api.post<{ sent: boolean }>(`/pivots/${encodeURIComponent(userId)}/contact`, { message });
    return data;
  },
};
