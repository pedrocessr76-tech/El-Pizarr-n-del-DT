export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface PlayerStats {
  pace: number; // 1..99
  shooting: number; // 1..99
  passing: number; // 1..99
  dribbling: number; // 1..99
  defending: number; // 1..99
  physical: number; // 1..99
}

export interface Player {
  id: string;
  name: string;
  nationality: string;
  position: Position;
  rating?: number;
  stats: PlayerStats;
}

export interface Team {
  id: string;
  name: string;
  starters: Player[]; // 11
  substitutes: Player[]; // 7
}

export type MatchStatus = 'PENDING' | 'PLAYING' | 'FINISHED';

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  winnerId?: string; // Para torneos, necesitamos saber quién avanza
}

export type RoundName = 'OCTAVOS' | 'CUARTOS' | 'SEMIS' | 'FINAL';

export interface Tournament {
  id: string;
  userTeam: Team;
  opponents: Team[];
  rounds: Record<RoundName, Match[]>;
  currentRound: RoundName;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}
