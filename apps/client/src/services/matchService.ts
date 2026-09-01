import { api } from './api';
import type { Match, Team, Tournament, MatchSummary } from '../../../../packages/shared/types/models';

export interface CreateTournamentResponse extends Tournament {}

export interface SimulateMatchResponse extends Match {}

export interface GetTournamentResponse extends Tournament {}

export interface AdvanceTournamentResponse extends Tournament {}

export interface HistoryMatchItem {
  id: string;
  round: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  status: string;
  winnerId?: string;
  summary?: MatchSummary;
}

export interface HistoryTournamentItem {
  id: string;
  createdAt: string;
  status: string;
  currentRound: string;
  userTeamId: string;
  userTeamName: string;
  matches: HistoryMatchItem[];
}

export const matchService = {
  async createTournament(userTeamId: string, userId?: string, sessionId?: string): Promise<CreateTournamentResponse> {
    const { data } = await api.post<CreateTournamentResponse>('/match/tournament/create', { userTeamId, userId, sessionId });
    return data;
  },

  async simulateMatch(matchId: string): Promise<SimulateMatchResponse> {
    const { data } = await api.post<SimulateMatchResponse>('/match/tournament/simulate-match', { matchId });
    return data;
  },

  async advanceTournament(tournamentId: string): Promise<AdvanceTournamentResponse> {
    const { data } = await api.post<AdvanceTournamentResponse>(`/match/tournament/${tournamentId}/advance`);
    return data;
  },

  async completeTournament(tournamentId: string): Promise<{ success: boolean }> {
    const { data } = await api.post<{ success: boolean }>(`/match/tournament/${tournamentId}/complete`);
    return data;
  },

  async getTournament(tournamentId: string): Promise<GetTournamentResponse> {
    const { data } = await api.get<GetTournamentResponse>(`/match/tournament/${tournamentId}`);
    return data;
  },

  async getHistory(userId?: string, sessionId?: string): Promise<{ tournaments: HistoryTournamentItem[] }> {
    const params: Record<string, string> = {};
    if (userId) params.userId = userId;
    if (sessionId) params.sessionId = sessionId;
    const { data } = await api.get<{ tournaments: HistoryTournamentItem[] }>('/match/history', { params });
    return data;
  },

  async getTeam(teamId: string): Promise<Team> {
    const { data } = await api.get<Team>(`/match/team/${teamId}`);
    return data;
  },
};