export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
export interface PlayerStats {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
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
    startingEleven: Player[];
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
