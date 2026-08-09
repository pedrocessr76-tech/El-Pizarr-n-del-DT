import { api } from './api';
import type { Match, Team } from '../../../../packages/shared/types/models';

export interface CreateTournamentResponse {
  id: string;
  userTeam: Team;
  opponents: Team[];
  rounds: Record<string, Match[]>;
  currentRound: string;
  status: string;
}

export interface SimulateMatchResponse extends Match {}

export interface GetTournamentResponse {
  rounds: Record<string, Match[]>;
}

export const matchService = {
  async createTournament(userTeamId: string, userId?: string): Promise<CreateTournamentResponse> {
    const { data } = await api.post<CreateTournamentResponse>('/match/tournament/create', { userTeamId, userId });
    return data;
  },

  async simulateMatch(matchId: string): Promise<SimulateMatchResponse> {
    const { data } = await api.post<SimulateMatchResponse>('/match/tournament/simulate-match', { matchId });
    return data;
  },

  async getTournament(tournamentId: string): Promise<GetTournamentResponse> {
    const { data } = await api.get<GetTournamentResponse>(`/match/tournament/${tournamentId}`);
    return data;
  },

  async getTeam(teamId: string): Promise<Team> {
    const { data } = await api.get<Team>(`/match/team/${teamId}`);
    return data;
  },
};