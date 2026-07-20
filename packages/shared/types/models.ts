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
  stats: PlayerStats;
}

export interface Team {
  id: string;
  name: string;
  startingEleven: Player[]; // Debe contener 11 jugadores
}

export type MatchStatus = 'PENDING' | 'PLAYING' | 'FINISHED';

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
}
