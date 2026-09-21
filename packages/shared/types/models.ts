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
  summary?: MatchSummary; // Resumen por jugador (calificaciones/goles) del partido
}

// Estadísticas individuales de un jugador en un partido concreto (resumen).
export interface PlayerMatchStats {
  playerId: string;
  name: string;
  position: Position;
  rating: number; // OVR base del jugador (1-99)
  matchRating: number; // Calificación del partido (escala 1-10)
  goals: number;
  assists: number;
}

// Resumen por jugador de un partido: calificaciones y goles/asistencias por equipo.
export interface MatchSummary {
  home: PlayerMatchStats[];
  away: PlayerMatchStats[];
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

// --- Notificaciones en tiempo real (WebSocket) ---
export type NotificationType =
  | 'goal'
  | 'match_end'
  | 'round_advance'
  | 'user_turn'
  | 'change_requested'
  | 'tournament_start'
  | 'tournament_end'
  | 'achievement_unlocked'
  | 'system_maintenance'
  | 'b2b_booking_pending'
  | 'b2b_booking_confirmed'
  | 'b2b_booking_cancelled'
  | 'b2b_booking_completed'
  | 'b2b_booking_rescheduled'
  | 'b2b_org_announcement';

export type Severity = 'info' | 'success' | 'warning' | 'error';

export interface NotificationPayload {
  type: NotificationType;
  severity: Severity;
  title: string;
  body: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Payload extendido para Sistema Canchas (B2B): agrega identidad de la fila
// persistida (b2b_notifications) para que el cliente evite duplicados.
export interface B2bNotificationPayload extends NotificationPayload {
  id: string;
  read: boolean;
  createdAt: string;
}
