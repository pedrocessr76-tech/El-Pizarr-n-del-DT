import { api } from './api';
import type { Player } from '../../../../packages/shared/types/models';

export interface PlayerPack {
  players: Player[];
}

export interface SelectPlayerResponse {
  success: boolean;
  player: Player | null;
  message: string;
}

export interface CreateTeamResponse {
  teamId: string;
}

export interface TeamActionResponse {
  success: boolean;
  message: string;
}

export const draftService = {
  async getPack(position?: string): Promise<PlayerPack> {
    const { data } = await api.get<PlayerPack>('/draft/pack', { params: { position } });
    return data;
  },

  async selectPlayer(playerId: string): Promise<SelectPlayerResponse> {
    const { data } = await api.post<SelectPlayerResponse>('/draft/select', { playerId });
    return data;
  },

  async createTeam(userId?: string, sessionId?: string): Promise<CreateTeamResponse> {
    const { data } = await api.post<CreateTeamResponse>('/draft/team', { userId, sessionId });
    return data;
  },

  async cleanupSession(sessionId: string): Promise<void> {
    await api.post('/draft/session/cleanup', { sessionId });
  },

  async addPlayerToTeam(teamId: string, playerId: string, isStarter = true): Promise<TeamActionResponse> {
    const { data } = await api.post<TeamActionResponse>('/draft/team/player', { teamId, playerId, isStarter });
    return data;
  },

  async removePlayerFromTeam(teamId: string, playerId: string): Promise<TeamActionResponse> {
    const { data } = await api.delete<TeamActionResponse>(`/draft/team/${teamId}/player/${playerId}`);
    return data;
  },

  async resetTeam(teamId: string): Promise<TeamActionResponse> {
    const { data } = await api.post<TeamActionResponse>(`/draft/team/${teamId}/reset`);
    return data;
  },
};