import { api } from './api';
import type { Player } from '../../../../packages/shared/types/models';

export interface PlayerFilters {
  name?: string;
  position?: string;
  rarity?: 'gold' | 'silver' | 'bronze';
  minRating?: number;
  maxRating?: number;
}

export const playerService = {
  async getAllPlayers(filters: PlayerFilters = {}): Promise<Player[]> {
    const params: Record<string, string | number | undefined> = {};
    if (filters.name) params.name = filters.name;
    if (filters.position) params.position = filters.position;
    if (filters.rarity) params.rarity = filters.rarity;
    if (filters.minRating != null) params.minRating = filters.minRating;
    if (filters.maxRating != null) params.maxRating = filters.maxRating;
    const { data } = await api.get<Player[]>('/players', { params });
    return data;
  },
};