import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { MatchEntity } from '../match/entities/match.entity';
import { TournamentEntity } from '../match/entities/tournament.entity';
import type { Player } from '../../../../packages/shared/types/models';

export interface PlayerPack {
  players: Player[];
}

@Injectable()
export class DraftService {
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

  async getPack(position?: string): Promise<PlayerPack> {
    const count = await this.playerRepo.count();
    if (count === 0) {
      return { players: [] };
    }

    // Pool de candidatos: todos los jugadores, o solo los de la posición exacta elegida.
    let pool: PlayerEntity[];
    if (!position || position === 'ANY') {
      pool = await this.playerRepo.find();
    } else {
      // Solo jugadores de la posición exacta (ej. DC → solo DC, sin ST/SD).
      const exactPosition = position.toUpperCase();
      pool = await this.playerRepo
        .createQueryBuilder('p')
        .where('UPPER(p.position) = :position', { position: exactPosition })
        .getMany();
    }

    if (pool.length === 0) {
      return { players: [] };
    }

    // 1) Elección del tipo de sobre por probabilidad.
    //    - 10%  → Bajo: los 5 jugadores menor a 75
    //    - 70%  → Medio: los 5 jugadores de 75 a 85 (el más habitual)
    //    - 20%  → Bueno: los 5 jugadores de 88 para arriba
    const roll = Math.random();
    let candidates: PlayerEntity[];
    if (roll < 0.1) {
      candidates = pool.filter((p) => p.rating < 75);
    } else if (roll < 0.8) {
      candidates = pool.filter((p) => p.rating >= 75 && p.rating <= 85);
    } else {
      candidates = pool.filter((p) => p.rating >= 88);
    }

    // Barajar los candidatos del tipo elegido y tomar hasta 5 sin repetir.
    const result: Player[] = [];
    const picked = new Set<string>();
    for (const entity of this.shuffle(candidates)) {
      if (result.length >= 5) break;
      if (picked.has(entity.id)) continue;
      picked.add(entity.id);
      result.push(this.toPlayer(entity));
    }

    // Relleno defensivo: si la franja no tenía 5 jugadores disponibles,
    // completar el sobre con el resto del pool para no romper el flujo.
    if (result.length < 5) {
      const remaining = this.shuffle(pool.filter((p) => !picked.has(p.id)));
      for (const entity of remaining) {
        if (result.length >= 5) break;
        picked.add(entity.id);
        result.push(this.toPlayer(entity));
      }
    }

    return { players: result };
  }

  // Baraja un array sin mutar el original (Fisher-Yates).
  private shuffle<T>(input: T[]): T[] {
    const arr = [...input];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async selectPlayer(playerId: string): Promise<{ success: boolean; player: Player | null; message: string }> {
    const playerEntity = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!playerEntity) {
      throw new NotFoundException('Jugador no encontrado en la base de datos.');
    }

    const player = this.toPlayer(playerEntity);
    return {
      success: true,
      player,
      message: 'Jugador encontrado. Listo para seleccionar.',
    };
  }

  async createTeam(userId?: string, sessionId?: string): Promise<{ teamId: string }> {
    // 1) Sesión invitado: reusar equipo existente de esta sesión
    if (sessionId && !userId) {
      const existing = await this.teamRepo.findOne({ where: { sessionId } });
      if (existing) return { teamId: existing.id };
    }

    // 2) Usuario logueado adopta equipo invitado (login en mitad de sesión)
    if (userId && sessionId) {
      const sessionTeam = await this.teamRepo.findOne({ where: { sessionId } });
      if (sessionTeam) {
        sessionTeam.userId = userId;
        sessionTeam.sessionId = null;
        await this.teamRepo.save(sessionTeam);
        return { teamId: sessionTeam.id };
      }
    }

    // 3) Usuario logueado: reusar su último equipo (evita "más de un mi equipo")
    if (userId) {
      const existing = await this.teamRepo.findOne({ where: { userId, isReal: false }, order: { createdAt: 'DESC' } });
      if (existing) return { teamId: existing.id };
    }

    // 4) Crear equipo nuevo
    const team = new TeamEntity();
    team.id = crypto.randomUUID();
    team.name = 'Mi Equipo';
    team.userId = userId;
    team.sessionId = sessionId;
    team.isReal = false; // El equipo del usuario nunca es un oponente IA real
    await this.teamRepo.save(team);
    return { teamId: team.id };
  }

  async cleanupSession(sessionId: string): Promise<{ success: boolean; cleaned: number }> {
    const teams = await this.teamRepo.find({ where: { sessionId } });
    const teamIds = teams.map(t => t.id);
    if (teamIds.length === 0) return { success: true, cleaned: 0 };

    // Torneos del invitado
    const tournaments = await this.tournamentRepo.find({ where: { userTeamId: In(teamIds) } });
    const tournamentIds = tournaments.map(t => t.id);
    if (tournamentIds.length) {
      await this.matchRepo.delete({ tournamentId: In(tournamentIds) });
      await this.tournamentRepo.delete(tournamentIds);
    }

    // Equipo y sus jugadores
    await this.teamPlayerRepo.delete({ teamId: In(teamIds) });
    await this.teamRepo.delete(teamIds);

    return { success: true, cleaned: teamIds.length };
  }

  async addPlayerToTeam(teamId: string, playerId: string, isStarter = true): Promise<{ success: boolean; message: string }> {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Equipo no encontrado.');
    }

    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) {
      throw new NotFoundException('Jugador no encontrado.');
    }

    const existing = await this.teamPlayerRepo.findOne({ where: { teamId, playerId } });
    if (existing) {
      throw new BadRequestException('El jugador ya está en el equipo.');
    }

    const starterCount = await this.teamPlayerRepo.count({ where: { teamId, isStarter: true } });
    const substituteCount = await this.teamPlayerRepo.count({ where: { teamId, isStarter: false } });

    // Validación de plantilla máxima (11 titulares + 7 suplentes = 18)
    if (starterCount + substituteCount >= 18) {
      throw new BadRequestException('El equipo ya tiene 18 jugadores (11 titulares + 7 suplentes).');
    }

    if (isStarter) {
      if (starterCount >= 11) {
        throw new BadRequestException('El equipo ya tiene 11 jugadores titulares.');
      }
    } else {
      if (substituteCount >= 7) {
        throw new BadRequestException('El equipo ya tiene 7 jugadores suplentes.');
      }
    }

    const tp = new TeamPlayerEntity();
    tp.teamId = teamId;
    tp.playerId = playerId;
    tp.isStarter = isStarter;
    tp.slotIndex = isStarter ? starterCount : substituteCount;
    await this.teamPlayerRepo.save(tp);

    return { success: true, message: isStarter ? 'Jugador agregado al equipo.' : 'Suplente agregado al equipo.' };
  }

  async removePlayerFromTeam(teamId: string, playerId: string): Promise<{ success: boolean; message: string }> {
    const tp = await this.teamPlayerRepo.findOne({ where: { teamId, playerId } });
    if (!tp) {
      throw new NotFoundException('El jugador no está en el equipo.');
    }

    await this.teamPlayerRepo.remove(tp);
    return { success: true, message: 'Jugador eliminado del equipo.' };
  }

  async resetTeam(teamId: string): Promise<{ success: boolean; message: string }> {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Equipo no encontrado.');
    }

    // Vacía el equipo eliminando todos sus jugadores (titulares y suplentes).
    await this.teamPlayerRepo.delete({ teamId });
    return { success: true, message: 'Equipo reiniciado.' };
  }
}
