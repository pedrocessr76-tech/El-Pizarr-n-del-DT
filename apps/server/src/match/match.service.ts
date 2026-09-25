import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { MatchEntity } from './entities/match.entity';
import { TournamentEntity } from './entities/tournament.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { matchSimulation } from './match-simulation';
import type { Match, Team, Player, Tournament, RoundName, MatchStatus, MatchSummary } from '../../../../packages/shared/types/models';
import * as crypto from 'crypto';
import { inValues, RepositoryPort, getRepositoryPortToken } from '../persistence/repository.port';
import { RepositorySession, UnitOfWork } from '../persistence/repository.port';
import { GAME_UNIT_OF_WORK } from '../persistence/persistence.module';

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
    @Inject(getRepositoryPortToken(PlayerEntity)) private readonly playerRepo: RepositoryPort<PlayerEntity>,
    @Inject(getRepositoryPortToken(TeamEntity)) private readonly teamRepo: RepositoryPort<TeamEntity>,
    @Inject(getRepositoryPortToken(TeamPlayerEntity)) private readonly teamPlayerRepo: RepositoryPort<TeamPlayerEntity>,
    @Inject(getRepositoryPortToken(MatchEntity)) private readonly matchRepo: RepositoryPort<MatchEntity>,
    @Inject(getRepositoryPortToken(TournamentEntity)) private readonly tournamentRepo: RepositoryPort<TournamentEntity>,
    @Inject(GAME_UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    private readonly notifications: NotificationsService,
  ) {}


  private toPlayer(entity: PlayerEntity): Player {
    return {
      id: entity.id,
      name: entity.name,
      nationality: entity.nationality,
      position: entity.position as Player['position'],
      rating: entity.rating,
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

  async getTeamById(teamId: string, repositories?: RepositorySession): Promise<Team | null> {
    const teams = repositories?.get(TeamEntity) ?? this.teamRepo;
    const teamPlayersRepo = repositories?.get(TeamPlayerEntity) ?? this.teamPlayerRepo;
    const playersRepo = repositories?.get(PlayerEntity) ?? this.playerRepo;
    const teamEntity = await teams.findOne({ where: { id: teamId } });
    if (!teamEntity) return null;

    const teamPlayers = await teamPlayersRepo.find({
      where: { teamId },
      order: { slotIndex: 'ASC' },
    });

    const playerIds = teamPlayers.map((tp) => tp.playerId);
    const playerEntities = playerIds.length ? await playersRepo.find({ where: { id: inValues(playerIds) } }) : [];
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

  /**
   * Lectura de un equipo por id restringida por ownership: permite ver equipos
   * propios y rivales IA (isReal, sin dueño), pero NUNCA equipos de otros usuarios.
   */
  async getTeamByIdForUser(teamId: string, userId: string): Promise<Team> {
    const teamEntity = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!teamEntity || (teamEntity.userId && teamEntity.userId !== userId)) {
      throw new NotFoundException('Equipo no encontrado.');
    }
    const team = await this.getTeamById(teamId);
    if (!team) throw new NotFoundException('Equipo no encontrado.');
    return team;
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

    // Simula un partido completo (ponderado por rating medio) y persiste el resultado.
    private async simulateAndPersistMatch(matchEntity: MatchEntity, repositories?: RepositorySession): Promise<Match> {
      const homeTeam = await this.getTeamById(matchEntity.homeTeamId, repositories);
      const awayTeam = await this.getTeamById(matchEntity.awayTeamId, repositories);
      if (!homeTeam || !awayTeam) throw new NotFoundException('Equipo no encontrado.');

      // Toda la logica de simulación vive en el módulo puro MatchSimulation
      // (apps/server/src/match/match-simulation.ts), cubierto por tests unitarios.
      const result = matchSimulation.simulateMatch(homeTeam, awayTeam);

      matchEntity.homeScore = result.homeScore;
      matchEntity.awayScore = result.awayScore;
      matchEntity.status = 'FINISHED';
      matchEntity.winnerId = result.winnerId;
      matchEntity.summaryJson = JSON.stringify(result.summary);

      await (repositories?.get(MatchEntity) ?? this.matchRepo).save(matchEntity);

      return {
        id: matchEntity.id,
        homeTeam,
        awayTeam,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        status: 'FINISHED',
        winnerId: result.winnerId,
        summary: result.summary,
      };
    }

    async simulateMatch(matchId: string, userId: string): Promise<Match> {
      const matchEntity = await this.matchRepo.findOne({ where: { id: matchId } });
      if (!matchEntity) throw new NotFoundException('Partido no encontrado.');

      // Ownership estricto: el partido debe pertenecer a un torneo de la identidad
      // del token (404 genérico para no revelar la existencia de recursos ajenos).
      const tournamentEntity = await this.tournamentRepo.findOne({ where: { id: matchEntity.tournamentId } });
      if (!tournamentEntity || tournamentEntity.userId !== userId) {
        throw new NotFoundException('Partido no encontrado.');
      }

      // Un partido ya jugado tiene resultado persistido: re-ejecutarlo permitiría
      // cambiar el marcador a voluntad (cheat detectado en la auditoría).
      if (matchEntity.status === 'FINISHED') {
        throw new BadRequestException('El partido ya fue jugado y su resultado está guardado.');
      }

      const result = await this.simulateAndPersistMatch(matchEntity);

      // La notificación de resultado (match_end) se emite desde el frontend
      // cuando el usuario termina de reproducir el partido en el LiveMatchOverlay,
      // no al simular, para que no se adelante al desenlace en vivo.

      return result;
    }

    async createTournament(userTeamId: string, userId: string): Promise<Tournament> {
    // El equipo debe ser de la identidad del token (404 genérico si es ajeno).
    const ownedTeam = await this.teamRepo.findOne({ where: { id: userTeamId } });
    if (!ownedTeam || ownedTeam.userId !== userId) {
      throw new NotFoundException('Equipo de usuario no encontrado.');
    }

    const userTeam = await this.getTeamById(userTeamId);
    if (!userTeam) throw new NotFoundException('Equipo de usuario no encontrado.');

    // 1) Limpiar estado residual: torneos previos SIN terminar de la misma identidad.
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

    // El torneo, sus cruces iniciales y la limpieza previa se confirman juntos.
    const octavos = await this.unitOfWork.execute(async (repositories) => {
      const matches = repositories.get(MatchEntity);
      const tournaments = repositories.get(TournamentEntity);
      const previousTournaments = await tournaments.find({ where: { userId, status: 'IN_PROGRESS' } });
      for (const previous of previousTournaments) {
        await matches.delete({ tournamentId: previous.id });
        await tournaments.delete(previous.id);
      }

      const tournamentEntity = new TournamentEntity();
      tournamentEntity.id = tournamentId;
      tournamentEntity.userId = userId;
      tournamentEntity.userTeamId = userTeamId;
      tournamentEntity.status = 'IN_PROGRESS';
      tournamentEntity.currentRound = 'OCTAVOS';
      await tournaments.save(tournamentEntity);

      const firstRound: Match[] = [];
      for (let i = 0; i < allTeams.length; i += 2) {
        const home = allTeams[i];
        const away = allTeams[i + 1];
        if (!home || !away) throw new BadRequestException('Error al generar los cruces de octavos de final.');
        const matchEntity = new MatchEntity();
        matchEntity.id = crypto.randomUUID();
        matchEntity.tournamentId = tournamentId;
        matchEntity.round = 'OCTAVOS';
        matchEntity.userId = userId;
        matchEntity.homeTeamId = home.id;
        matchEntity.awayTeamId = away.id;
        matchEntity.homeScore = 0;
        matchEntity.awayScore = 0;
        matchEntity.status = 'PENDING';
        await matches.save(matchEntity);
        firstRound.push({ id: matchEntity.id, homeTeam: home, awayTeam: away, homeScore: 0, awayScore: 0, status: 'PENDING' });
      }
      return firstRound;
    });

    // 5) Avisar al usuario / sesión de que el torneo comenzó.
    this.notifications.notify(userId, undefined, {
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


  async getTournament(tournamentId: string, userId: string): Promise<Tournament> {
    const tournamentEntity = await this.tournamentRepo.findOne({ where: { id: tournamentId } });
    // Sólo el dueño puede leer el torneo (404 genérico para no revelar existencia)
    if (!tournamentEntity || tournamentEntity.userId !== userId) {
      throw new NotFoundException('Torneo no encontrado.');
    }

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
  async advanceTournament(tournamentId: string, userId: string): Promise<Tournament> {
    const result = await this.unitOfWork.execute(async (repositories) => {
      const tournaments = repositories.get(TournamentEntity);
      const matches = repositories.get(MatchEntity);
      const tournamentEntity = await tournaments.findOne({ where: { id: tournamentId }, lock: { mode: 'pessimistic_write' } });
      if (!tournamentEntity || tournamentEntity.userId !== userId) throw new NotFoundException('Torneo no encontrado.');
      if (tournamentEntity.status === 'COMPLETED') return { completed: true as const };

      const currentRound = tournamentEntity.currentRound as RoundName;
      const currentMatches = await matches.find({ where: { tournamentId, round: currentRound } });
      const userMatch = currentMatches.find(
        (match) => match.homeTeamId === tournamentEntity.userTeamId || match.awayTeamId === tournamentEntity.userTeamId,
      );
      if (!userMatch || userMatch.status !== 'FINISHED') {
        throw new BadRequestException('Debes jugar tu partido antes de que avance la llave.');
      }

      for (const match of currentMatches) {
        if (match.status !== 'FINISHED') await this.simulateAndPersistMatch(match, repositories);
      }

      const winners: Team[] = [];
      for (const match of currentMatches) {
        if (!match.winnerId) throw new BadRequestException('No se pudo determinar el ganador de un cruce.');
        const team = await this.getTeamById(match.winnerId, repositories);
        if (!team) throw new BadRequestException('No se encontró el equipo ganador de un cruce.');
        winners.push(team);
      }

      if (currentRound === 'FINAL') {
        tournamentEntity.status = 'COMPLETED';
        await tournaments.save(tournamentEntity);
        return { completed: true as const };
      }

      const currentIndex = ROUND_ORDER.indexOf(currentRound);
      const nextRound = ROUND_ORDER[currentIndex + 1];
      if (!nextRound) throw new BadRequestException('Ronda inválida.');
      const nextRoundCount = await matches.count({ where: { tournamentId, round: nextRound } });
      if (nextRoundCount === 0) {
        for (let i = 0; i < winners.length; i += 2) {
          const home = winners[i];
          const away = winners[i + 1];
          if (!home || !away) throw new BadRequestException('Estructura de llaves inválida para la siguiente ronda.');
          const nextMatch = new MatchEntity();
          nextMatch.id = crypto.randomUUID();
          nextMatch.tournamentId = tournamentId;
          nextMatch.round = nextRound;
          nextMatch.userId = tournamentEntity.userId;
          nextMatch.homeTeamId = home.id;
          nextMatch.awayTeamId = away.id;
          nextMatch.homeScore = 0;
          nextMatch.awayScore = 0;
          nextMatch.status = 'PENDING';
          await matches.save(nextMatch);
        }
      }
      tournamentEntity.currentRound = nextRound;
      await tournaments.save(tournamentEntity);
      return { completed: false as const, currentRound, nextRound, ownerId: tournamentEntity.userId };
    });

    if (result.completed) {
      this.notifications.notify(userId, undefined, {
        type: 'tournament_end', severity: 'success', title: '¡Campeón de la Copa Élite!',
        body: 'Tu equipo se coronó campeón del torneo. ¡Felicidades!', metadata: { tournamentId },
      });
    } else {
      this.notifications.notify(result.ownerId, undefined, {
        type: 'round_advance', severity: 'info', title: 'Avance de ronda: ' + result.nextRound,
        body: 'Tu equipo superó ' + result.currentRound + '. Descubrí tus nuevos rivales.',
        metadata: { tournamentId, round: result.nextRound },
      });
    }
    return this.getTournament(tournamentId, userId);
  }

  /** Marca un torneo como COMPLETADO (usado al finalizar por derrota). */
  async completeTournament(tournamentId: string, userId: string): Promise<{ success: boolean }> {
    const tournamentEntity = await this.tournamentRepo.findOne({ where: { id: tournamentId } });
    if (!tournamentEntity || tournamentEntity.userId !== userId) {
      throw new NotFoundException('Torneo no encontrado.');
    }
    if (tournamentEntity.status !== 'COMPLETED') {
      tournamentEntity.status = 'COMPLETED';
      await this.tournamentRepo.save(tournamentEntity);
    }
this.notifications.notify(tournamentEntity.userId, undefined, {
        type: 'tournament_end',
        severity: 'warning',
        title: 'Torneo finalizado',
        body: 'Tu Copa Élite ha terminado. Volvé a intentar cuando quieras.',
        metadata: { tournamentId },
      });
    return { success: true };
  }

  async getHistory(userId: string): Promise<{ tournaments: any[] }> {
    // La identidad viene del token (usuario registrado o invitado anónimo),
    // por lo que el historial es siempre el de esa identidad.
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
