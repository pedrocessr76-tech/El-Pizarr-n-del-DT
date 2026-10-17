import { api } from './api';
import type { Player } from '../../../../packages/shared/types/models';

export interface PlayerFilters {
  name?: string;
  position?: string;
  rarity?: 'gold' | 'silver' | 'bronze';
  minRating?: number;
  maxRating?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedPlayersResponse {
  data: Player[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const playerService = {
  async getPlayers(filters: PlayerFilters = {}): Promise<PaginatedPlayersResponse> {
    const params: Record<string, string | number | undefined> = {};
    if (filters.name) params.name = filters.name;
    if (filters.position) params.position = filters.position;
    if (filters.rarity) params.rarity = filters.rarity;
    if (filters.minRating != null) params.minRating = filters.minRating;
    if (filters.maxRating != null) params.maxRating = filters.maxRating;
    if (filters.page != null) params.page = filters.page;
    if (filters.limit != null) params.limit = filters.limit;
    const { data } = await api.get<PaginatedPlayersResponse>('/players', { params });
    return data;
  },

  /** @deprecated Usa getPlayers() que devuelve paginación. Mantenido para compatibilidad. */
  async getAllPlayers(filters: PlayerFilters = {}): Promise<Player[]> {
    const result = await playerService.getPlayers({ ...filters, limit: 100 });
    return result.data;
  },
};