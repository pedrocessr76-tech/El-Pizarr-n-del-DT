import { api } from './api';
import type { Player } from '../../../../packages/shared/types/models';

export const playerService = {
  async getAllPlayers(): Promise<Player[]> {
    const { data } = await api.get<Player[]>('/players');
    return data;
  },
};