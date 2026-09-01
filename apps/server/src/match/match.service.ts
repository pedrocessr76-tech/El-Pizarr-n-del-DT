import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { MatchEntity } from './entities/match.entity';
import { TournamentEntity } from './entities/tournament.entity';
import { NotificationsService } from '../notifications/notifications.service';
import type { Match, Team, Player, Tournament, RoundName, MatchStatus, MatchSummary, PlayerMatchStats } from '../../../../packages/shared/types/models';
import * as crypto from 'crypto';

const ROUND_ORDER: RoundName[] = ['OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL'];

// Parsea JSON de forma segura ante campos ausentes o corruptos.
function parseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(TeamPlayerEntity)
    private readonly teamPlayerRepo: Repository<TeamPlayerEntity>,
    @InjectRepository(MatchEntity)
    private readonly matchRepo: Repository<MatchEntity>,
    @InjectRepository(TournamentEntity)
    private readonly tournamentRepo: Repository<TournamentEntity>,
    private readonly notifications: NotificationsService,
  ) {}


  private toPlayer(entity: PlayerEntity): Player {
    return {
      id: entity.id,
      name: entity.name,
      nationality: entity.nationality,
      position: entity.position as Player['position'],
      stats: {
        pace: entity.pace,
        shooting: entity.shooting,
        passing: entity.passing,
        dribbling: entity.dribbling,
        defending: entity.defending,
        physical: entity.physical,
      },
    };
  }

  async getTeamById(teamId: string): Promise<Team | null> {
    const teamEntity = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!teamEntity) return null;

    const teamPlayers = await this.teamPlayerRepo.find({
      where: { teamId },
      order: { slotIndex: 'ASC' },
    });

    const playerIds = teamPlayers.map((tp) => tp.playerId);
    const playerEntities = await this.playerRepo.find({ where: { id: In(playerIds) } });
    const playerMap = new Map(playerEntities.map((p) => [p.id, this.toPlayer(p)]));

    const starters: Player[] = [];
    const substitutes: Player[] = [];

    for (const tp of teamPlayers) {
      const player = playerMap.get(tp.playerId);
      if (player) {
        if (tp.isStarter) {
          starters.push(player);
        } else {
          substitutes.push(player);
        }
      }
    }

    return {
      id: teamEntity.id,
      name: teamEntity.name,
      starters,
      substitutes,
    };
  }

    private averageTeamRating(team: Team): number {
      const ratings = team.starters
        .filter((player) => typeof player.rating === 'number')
        .map((player) => player.rating as number);
      if (ratings.length === 0) return 50;
      return ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }

    private sumTeamStats(team: Team): number {
      return team.starters.reduce((total, player) => {
        return total + player.stats.pace + player.stats.shooting + player.stats.passing + player.stats.dribbling + player.stats.defending + player.stats.physical;
      }, 0);
    }

    // Distribución de goles: selecciona goleadores de forma ponderada por su disparo
    // (bonus para delanteros y mediapuntas). Devuelve un mapa playerId -> goles.
    private assignGoalScorers(players: Player[], totalGoals: number): Record<string, number> {
      const goals: Record<string, number> = {};
      if (players.length === 0 || totalGoals <= 0) return goals;

      const weightFor = (p: Player): number =>
        (p.stats?.shooting ?? 5) +
        (p.position === 'FWD' ? 15 : p.position === 'MID' ? 8 : 0);

      for (let g = 0; g < totalGoals; g++) {
        const totalWeight = players.reduce((s, p) => s + weightFor(p), 0);
        if (totalWeight <= 0) break;
        let r = Math.random() * totalWeight;
        for (const p of players) {
          r -= weightFor(p);
          if (r <= 0) {
            goals[p.id] = (goals[p.id] ?? 0) + 1;
            break;
          }
        }
      }
      return goals;
    }

    // Distribución de asistencias (ponderada por pase), sin repetir demasiado al goleador.
    private assignAssists(players: Player[], total: number, goalScorers: Record<string, number>): Record<string, number> {
      const assists: Record<string, number> = {};
      if (players.length === 0 || total <= 0) return assists;

      const weightFor = (p: Player): number =>
        (p.stats?.passing ?? 5) + (p.position === 'MID' ? 10 : p.position === 'FWD' ? 5 : 0);

      for (let a = 0; a < total; a++) {
        const options = players.filter((p) => (goalScorers[p.id] ?? 0) === 0);
        const pool = options.length > 0 ? options : players;
        const totalWeight = pool.reduce((s, p) => s + weightFor(p), 0);
        if (totalWeight <= 0) break;
        let r = Math.random() * totalWeight;
        for (const p of pool) {
          r -= weightFor(p);
          if (r <= 0) {
            assists[p.id] = (assists[p.id] ?? 0) + 1;
            break;
          }
        }
      }
      return assists;
    }

    // Calcula la calificación (1-10) de cada titular y sus goles/asistencias.
    private computeMatchSummary(team: Team, goals: number): PlayerMatchStats[] {
      const starters = team.starters;
      if (starters.length === 0) return [];

      const goalScorers = this.assignGoalScorers(starters, goals);
      const totalAssists = Math.min(2, goals);
      const assistantIds = this.assignAssists(starters, totalAssists, goalScorers);

      return starters.map((p) => {
        const base = (p.rating ?? 50) / 10; // OVR -> base sobre 10
        const perf = Math.random() * 1.4 - 0.8; // rendimiento: -0.8 .. +0.6
        const goalBonus = Math.min(1.5, (goalScorers[p.id] ?? 0) * 0.7);
        const assistBonus = (assistantIds[p.id] ?? 0) * 0.3;
        const matchRating = Math.min(
          10,
          Math.max(1, Math.round((base + perf + goalBonus + assistBonus) * 10) / 10),
        );

        return {
          playerId: p.id,
          name: p.name,
          position: p.position,
          rating: p.rating ?? 50,
          matchRating,
          goals: goalScorers[p.id] ?? 0,
          assists: assistantIds[p.id] ?? 0,
        };
      });
    }

    private shuffle<T>(input: T[]): T[] {
      const arr = [...input];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    // Nombre normalizado para detectar equipos duplicados: minúsculas, sin acentos,
    // sin "FC/CF" como palabra suelta y con espacios colapsados.
    private normalizeTeamName(name: string): string {
      return (name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\b(?:fc|cf)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Distribución de Poisson (Knuth): nº de goles esperados según lambda
    private poissonRandom(lambda: number): number {
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do {
        k += 1;
        p *= Math.random();
      } while (p > L);
      return Math.max(0, k - 1);
    }

    // Simula un partido completo (ponderado por rating medio) y persiste el resultado.
    private async simulateAndPersistMatch(matchEntity: MatchEntity): Promise<Match> {
      const homeTeam = await this.getTeamById(matchEntity.homeTeamId);
      const awayTeam = await this.getTeamById(matchEntity.awayTeamId);
      if (!homeTeam || !awayTeam) throw new NotFoundException('Equipo no encontrado.');

      const homeRating = this.averageTeamRating(homeTeam);
      const awayRating = this.averageTeamRating(awayTeam);
      const ratingDiff = homeRating - awayRating;

      // Goles esperados ponderados: ±12 puntos de rating ≈ ±1 gol esperado.
      const homeLambda = Math.max(0.25, 1.5 + ratingDiff / 12);
      const awayLambda = Math.max(0.25, 1.5 - ratingDiff / 12);

      const homeScore = Math.min(7, this.poissonRandom(homeLambda));
      const awayScore = Math.min(7, this.poissonRandom(awayLambda));

      let winnerId = homeScore > awayScore ? homeTeam.id : awayTeam.id;

      // Empate → tanda de penales ponderada por rating para decidir quien avanza.
      if (homeScore === awayScore) {
        const homeWinProb = Math.min(0.85, Math.max(0.15, 0.5 + ratingDiff / 40));
        winnerId = Math.random() < homeWinProb ? homeTeam.id : awayTeam.id;
      }

      matchEntity.homeScore = homeScore;
      matchEntity.awayScore = awayScore;
      matchEntity.status = 'FINISHED';
      matchEntity.winnerId = winnerId;

      // Resumen por jugador: calificaciones, goles y asistencias de cada titular.
      const summary: MatchSummary = {
        home: this.computeMatchSummary(homeTeam, homeScore),
        away: this.computeMatchSummary(awayTeam, awayScore),
      };
      matchEntity.summaryJson = JSON.stringify(summary);

      await this.matchRepo.save(matchEntity);

      return {
        id: matchEntity.id,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        status: 'FINISHED',
        winnerId,
        summary,
      };
    }

    async simulateMatch(matchId: string): Promise<Match> {
      const matchEntity = await this.matchRepo.findOne({ where: { id: matchId } });
      if (!matchEntity) throw new NotFoundException('Partido no encontrado.');
      const result = await this.simulateAndPersistMatch(matchEntity);

      // Notificación de fin de partido para el usuario / sesión propietaria del torneo.
      if (matchEntity.userId || matchEntity.sessionId) {

        const tournament = matchEntity.tournamentId
          ? await this.tournamentRepo.findOne({ where: { id: matchEntity.tournamentId } })
          : null;
        const userTeamId = tournament?.userTeamId;
        const userWon = !!userTeamId && result.winnerId === userTeamId;
        const homeTeam = await this.getTeamById(matchEntity.homeTeamId);
        const awayTeam = await this.getTeamById(matchEntity.awayTeamId);
        this.notifications.notify(matchEntity.userId, matchEntity.sessionId, {
          type: 'match_end',
          severity: userWon ? 'success' : 'error',
          title: userWon ? '¡Victoria!' : 'Derrota',
          body: `${homeTeam?.name ?? 'Local'} ${result.homeScore} - ${result.awayScore} ${awayTeam?.name ?? 'Visitante'}`,
          metadata: { matchId: matchEntity.id },
        });
      }

      return result;
    }

    async createTournament(userTeamId: string, userId?: string, sessionId?: string): Promise<Tournament> {

    // Validar identidad: o userId o sessionId
    if (!userId && !sessionId) {
      throw new NotFoundException('Se requiere identidad (usuario o sesión) para crear un torneo.');
    }

    const userTeam = await this.getTeamById(userTeamId);
    if (!userTeam) throw new NotFoundException('Equipo de usuario no encontrado.');

    // 1) Limpiar estado residual: torneos previos SIN terminar de la misma identidad.
    const identityWhere = userId ? { userId } : { sessionId };
    const previousTournaments = await this.tournamentRepo.find({ where: { ...identityWhere, status: 'IN_PROGRESS' } });
    if (previousTournaments.length) {
      const previousIds = previousTournaments.map((t) => t.id);
      await this.matchRepo.delete({ tournamentId: In(previousIds) });
      await this.tournamentRepo.delete(previousIds);
    }

    // 2) 15 oponentes ÚNICOS (sin duplicados por nombre; excluye al equipo del usuario por ID y nombre)
    const allAvailableTeams = await this.teamRepo.find({ where: { isReal: true } });
    const shuffledTeams = this.shuffle(allAvailableTeams);

    const userTeamNameKey = this.normalizeTeamName(userTeam.name);
    const usedNames = new Set<string>([userTeamNameKey]);
    const opponents: Team[] = [];

    for (const entity of shuffledTeams) {
      if (opponents.length >= 15) break;
      if (entity.id === userTeamId) continue;
      const nameKey = this.normalizeTeamName(entity.name);
      if (!nameKey || usedNames.has(nameKey)) continue; // evita "Mi Equipo" residual repetido
      const team = await this.getTeamById(entity.id);
      if (!team || team.starters.length === 0) continue; // solo equipos jugables
      usedNames.add(nameKey);
      opponents.push(team);
    }

    if (opponents.length < 15) {
      throw new BadRequestException(
        'No hay suficientes equipos disponibles en la base de datos para armar el torneo (se necesitan 15 oponentes únicos).',
      );
    }


    // 3) Mezclar los 16 equipos para generar los 8 cruces de octavos.
    const allTeams = this.shuffle([userTeam, ...opponents]);
    const tournamentId = crypto.randomUUID();

    // 4) Persistir el torneo
    const tournamentEntity = new TournamentEntity();
    tournamentEntity.id = tournamentId;
    tournamentEntity.userId = userId;
    tournamentEntity.sessionId = sessionId;
    tournamentEntity.userTeamId = userTeamId;
    tournamentEntity.status = 'IN_PROGRESS';
    tournamentEntity.currentRound = 'OCTAVOS';
    await this.tournamentRepo.save(tournamentEntity);

    const octavos: Match[] = [];

    for (let i = 0; i < allTeams.length; i += 2) {
      const home = allTeams[i];
      const away = allTeams[i + 1];
      if (!home || !away) {
        throw new BadRequestException('Error al generar los cruces de octavos de final.');
      }

      const matchEntity = new MatchEntity();
      matchEntity.id = crypto.randomUUID();
      matchEntity.tournamentId = tournamentId;
      matchEntity.round = 'OCTAVOS';
      matchEntity.userId = userId;
      matchEntity.sessionId = sessionId;
      matchEntity.homeTeamId = home.id;
      matchEntity.awayTeamId = away.id;
      matchEntity.homeScore = 0;
      matchEntity.awayScore = 0;
      matchEntity.status = 'PENDING';
      await this.matchRepo.save(matchEntity);

      octavos.push({
        id: matchEntity.id,
        homeTeam: home,
        awayTeam: away,
        homeScore: 0,
        awayScore: 0,
        status: 'PENDING',
      });
    }

    // 5) Avisar al usuario / sesión de que el torneo comenzó.
    this.notifications.notify(userId, sessionId, {
      type: 'tournament_start',
      severity: 'info',
      title: '¡Torneo iniciado!',
      body: 'Tu Copa Élite ha comenzado. Suerte en la llave.',
      metadata: { tournamentId },
    });

    return {
      id: tournamentId,
      userTeam,
      opponents,
      rounds: { OCTAVOS: octavos, CUARTOS: [], SEMIS: [], FINAL: [] },
      currentRound: 'OCTAVOS',
      status: 'IN_PROGRESS',
    };
  }


  async getTournament(tournamentId: string): Promise<Tournament> {
    const tournamentEntity = await this.tournamentRepo.findOne({ where: { id: tournamentId } });
    if (!tournamentEntity) throw new NotFoundException('Torneo no encontrado.');

    const matches = await this.matchRepo.find({ where: { tournamentId } });
    const rounds: Record<RoundName, Match[]> = { OCTAVOS: [], CUARTOS: [], SEMIS: [], FINAL: [] };

    for (const m of matches) {
      const round = m.round as RoundName;
      if (!rounds[round]) continue;
      const homeTeam = await this.getTeamById(m.homeTeamId);
      const awayTeam = await this.getTeamById(m.awayTeamId);
      if (!homeTeam || !awayTeam) continue;
      rounds[round].push({
        id: m.id,
        homeTeam,
        awayTeam,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: m.status as MatchStatus,
        winnerId: m.winnerId ?? undefined,
      });
    }

    const userTeam = await this.getTeamById(tournamentEntity.userTeamId);

    return {
      id: tournamentEntity.id,
      userTeam: userTeam ?? { id: tournamentEntity.userTeamId, name: 'Mi Equipo', starters: [], substitutes: [] },
      opponents: [],
      rounds,
      currentRound: tournamentEntity.currentRound as RoundName,
      status: tournamentEntity.status as Tournament['status'],
    };
  }

  /**
   * Avanza la llave una fase:
   *  - Exige que el partido del usuario esté jugado.
   *  - Simula y persiste los partidos IA pendientes de la ronda actual.
   *  - Genera la siguiente ronda (OCTAVOS → CUARTOS → SEMIS → FINAL).
   *  - Si la Gran Final termina, marca el torneo como COMPLETADO.
   */
  async advanceTournament(tournamentId: string): Promise<Tournament> {
    const tournamentEntity = await this.tournamentRepo.findOne({ where: { id: tournamentId } });
    if (!tournamentEntity) throw new NotFoundException('Torneo no encontrado.');

    if (tournamentEntity.status === 'COMPLETED') {
      return this.getTournament(tournamentId);
    }

    const currentRound = tournamentEntity.currentRound as RoundName;
    const currentMatches = await this.matchRepo.find({ where: { tournamentId, round: currentRound } });

    // El partido del usuario DEBE estar jugado para avanzar de ronda.
    const userMatch = currentMatches.find(
      (m) => m.homeTeamId === tournamentEntity.userTeamId || m.awayTeamId === tournamentEntity.userTeamId,
    );
    if (!userMatch || userMatch.status !== 'FINISHED') {
      throw new BadRequestException('Debes jugar tu partido antes de que avance la llave.');
    }

    // Simular (y persistir) todos los partidos IA pendientes de la ronda actual.
    for (const m of currentMatches) {
      if (m.status !== 'FINISHED') {
        await this.simulateAndPersistMatch(m);
      }
    }

    // Ganadores en el orden de la llave → cruces de la siguiente ronda.
    const winners: Team[] = [];
    for (const m of currentMatches) {
      const persisted = await this.matchRepo.findOne({ where: { id: m.id } });
      const winnerId = persisted?.winnerId;
      if (!winnerId) throw new BadRequestException('No se pudo determinar el ganador de un cruce.');
      const team = await this.getTeamById(winnerId);
      if (!team) throw new BadRequestException('No se encontró el equipo ganador de un cruce.');
      winners.push(team);
    }

    // Gran Final terminada → torneo COMPLETADO.
    if (currentRound === 'FINAL') {
      tournamentEntity.status = 'COMPLETED';
      await this.tournamentRepo.save(tournamentEntity);
this.notifications.notify(tournamentEntity.userId, tournamentEntity.sessionId, {
        type: 'tournament_end',
        severity: 'success',
        title: '¡Campeón de la Copa Élite!',
        body: 'Tu equipo se coronó campeón del torneo. ¡Felicidades!',
        metadata: { tournamentId },
      });
      return this.getTournament(tournamentId);
    }

    const currentIdx = ROUND_ORDER.indexOf(currentRound);
    const nextRound = ROUND_ORDER[currentIdx + 1];
    if (!nextRound) throw new BadRequestException('Ronda inválida.');

    // Idempotencia: si la siguiente ronda ya fue generada, no duplicar cruces.
    const nextRoundCount = await this.matchRepo.count({ where: { tournamentId, round: nextRound } });
    if (nextRoundCount === 0) {
      for (let i = 0; i < winners.length; i += 2) {
        const home = winners[i];
        const away = winners[i + 1];
        if (!home || !away) {
          throw new BadRequestException('Estructura de llaves inválida para la siguiente ronda.');
        }

        const nextEntity = new MatchEntity();
        nextEntity.id = crypto.randomUUID();
        nextEntity.tournamentId = tournamentId;
        nextEntity.round = nextRound;
        nextEntity.userId = tournamentEntity.userId;
        nextEntity.sessionId = tournamentEntity.sessionId;
        nextEntity.homeTeamId = home.id;
        nextEntity.awayTeamId = away.id;
        nextEntity.homeScore = 0;
        nextEntity.awayScore = 0;
        nextEntity.status = 'PENDING';
        await this.matchRepo.save(nextEntity);
      }
    }

    tournamentEntity.currentRound = nextRound;
    await this.tournamentRepo.save(tournamentEntity);

this.notifications.notify(tournamentEntity.userId, tournamentEntity.sessionId, {
        type: 'round_advance',
        severity: 'info',
        title: 'Avance de ronda: ' + nextRound,
        body: 'Tu equipo superó ' + currentRound + '. Descubrí tus nuevos rivales.',
        metadata: { tournamentId, round: nextRound },
      });
    return this.getTournament(tournamentId);
  }

  /** Marca un torneo como COMPLETADO (usado al finalizar por derrota). */
  async completeTournament(tournamentId: string): Promise<{ success: boolean }> {
    const tournamentEntity = await this.tournamentRepo.findOne({ where: { id: tournamentId } });
    if (!tournamentEntity) throw new NotFoundException('Torneo no encontrado.');
    if (tournamentEntity.status !== 'COMPLETED') {
      tournamentEntity.status = 'COMPLETED';
      await this.tournamentRepo.save(tournamentEntity);
    }
this.notifications.notify(tournamentEntity.userId, tournamentEntity.sessionId, {
        type: 'tournament_end',
        severity: 'warning',
        title: 'Torneo finalizado',
        body: 'Tu Copa Élite ha terminado. Volvé a intentar cuando quieras.',
        metadata: { tournamentId },
      });
    return { success: true };
  }

  async getHistory(userId?: string, sessionId?: string): Promise<{ tournaments: any[] }> {
    // Solo usuarios logueados tienen historial. Invitados siempre devuelven vacío.
    if (!userId) {
      return { tournaments: [] };
    }

    const tournaments = await this.tournamentRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    const result = [];

    for (const t of tournaments) {
      const matches = await this.matchRepo.find({ where: { tournamentId: t.id }, order: { round: 'ASC' } });
      const userTeam = await this.teamRepo.findOne({ where: { id: t.userTeamId } });

      const matchItems = await Promise.all(matches.map(async (m) => {
        const home = await this.teamRepo.findOne({ where: { id: m.homeTeamId } });
        const away = await this.teamRepo.findOne({ where: { id: m.awayTeamId } });
        return {
          id: m.id,
          round: m.round,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          homeTeamName: home?.name ?? '?',
          awayTeamName: away?.name ?? '?',
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          status: m.status,
          winnerId: m.winnerId,
          summary: m.summaryJson ? (parseJson<MatchSummary>(m.summaryJson) ?? undefined) : undefined,
        };
      }));

      result.push({
        id: t.id,
        createdAt: t.createdAt,
        status: t.status,
        currentRound: t.currentRound,
        userTeamId: t.userTeamId,
        userTeamName: userTeam?.name ?? 'Mi Equipo',
        matches: matchItems,
      });
    }

    return { tournaments: result };
  }
}
