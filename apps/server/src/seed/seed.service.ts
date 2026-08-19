import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { MatchEntity } from '../match/entities/match.entity';
import { TournamentEntity } from '../match/entities/tournament.entity';
import { mockPlayers } from '../../../../packages/shared/types/mockData';

// Nomenclatura FIFA estándar
type FIFA_POSITION = 
  | 'POR' | 'LD' | 'LI' | 'DFC' | 'MCD' | 'MC' | 'MCO' | 'MD' | 'MI' | 'ED' | 'EI' | 'SD' | 'DC' | 'ST';

interface PremierPlayer {
  nombre: string;
  posicion: string;
  rating: number;
  ritmo: number;
  tiro: number;
  pase: number;
  regate: number;
  defensa: number;
  fisico: number;
}

interface PremierTeam {
  nombre: string;
  abreviatura: string;
  jugadores: PremierPlayer[];
}

interface PremierData {
  liga: string;
  temporada: string;
  equipos: PremierTeam[];
}

const POSITION_MAP: Record<string, FIFA_POSITION> = {
  // Portero
  'GK': 'POR',
  'POR': 'POR',
  
  // Laterales
  'RB': 'LD',
  'RWB': 'LD',
  'LB': 'LI',
  'LWB': 'LI',
  
  // Defensas centrales
  'CB': 'DFC',
  'DEF': 'DFC',
  
  // Mediocentros
  'CDM': 'MCD',
  'CM': 'MC',
  'CAM': 'MCO',
  
  // Extremos y medios
  'RM': 'MD',
  'RW': 'ED',
  'LM': 'MI',
  'LW': 'EI',
  
  // Delanteros
  'FWD': 'DC',
  'ST': 'ST',
  'DC': 'DC',
  'CF': 'SD',
  'SS': 'SD',
  
  // Posiciones del JSON (formato antiguo) - solo las que no están ya definidas
  'LD': 'LD',
  'LI': 'LI',
  'DFC': 'DFC',
  'MCD': 'MCD',
  'MC': 'MC',
  'MCO': 'MCO',
  'ED': 'ED',
  'EI': 'EI',
};

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

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

  async onModuleInit() {
    await this.cleanupOrphanedGuestData();
    await this.seedMockPlayers();
    await this.seedPremierTeams();
    await this.seedLaLigaTeams();
    await this.seedExtraTeams();
  }

  /**
   * Limpia equipos huérfanos de versiones anteriores: userId=NULL, isReal=false, sessionId=NULL.
   * También borra sus torneos/partidos asociados.
   */
  private async cleanupOrphanedGuestData() {
    const orphans = await this.teamRepo.find({ where: { userId: IsNull(), isReal: false, sessionId: IsNull() } });
    if (orphans.length === 0) return;

    const orphanIds = orphans.map(t => t.id);
    this.logger.log(`🧹 Limpiando ${orphanIds.length} equipos huérfanos de sesiones antiguas...`);

    // Torneos y partidos de esos equipos
    const orphansTournaments = await this.tournamentRepo.find({ where: { userTeamId: In(orphanIds) } });
    const orphanTournamentIds = orphansTournaments.map(t => t.id);
    if (orphanTournamentIds.length) {
      await this.matchRepo.delete({ tournamentId: In(orphanTournamentIds) });
      await this.tournamentRepo.delete(orphanTournamentIds);
    }

    // Equipos
    await this.teamPlayerRepo.delete({ teamId: In(orphanIds) });
    await this.teamRepo.delete(orphanIds);

    this.logger.log(`✓ ${orphanIds.length} equipos huérfanos limpiados.`);
  }

  private async seedMockPlayers() {
    const count = await this.playerRepo.count();
    if (count > 0) {
      return;
    }

    const entities = mockPlayers.map((p) => {
      const entity = new PlayerEntity();
      entity.id = p.id;
      entity.name = p.name;
      entity.nationality = p.nationality;
      entity.position = p.position;
      entity.rating = Math.round(
        (p.stats.pace + p.stats.shooting + p.stats.passing + p.stats.dribbling + p.stats.defending + p.stats.physical) / 6,
      );
      entity.pace = p.stats.pace;
      entity.shooting = p.stats.shooting;
      entity.passing = p.stats.passing;
      entity.dribbling = p.stats.dribbling;
      entity.defending = p.stats.defending;
      entity.physical = p.stats.physical;
      return entity;
    });

    await this.playerRepo.save(entities);
    this.logger.log(`Seeded ${entities.length} mock players`);
  }

  private async seedPremierTeams() {
    const possiblePaths = [
      path.join(__dirname, 'data', 'premier_teams.json'),
      path.join(__dirname, '..', '..', '..', '..', 'seed', 'data', 'premier_teams.json'),
      path.join(process.cwd(), 'src', 'seed', 'data', 'premier_teams.json'),
    ];
    const filePath = possiblePaths.find(p => fs.existsSync(p));
    if (!filePath) {
      this.logger.warn('premier_teams.json not found, skipping Premier League seed');
      return;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data: PremierData = JSON.parse(raw);

    let teamsCreated = 0;
    let playersCreated = 0;
    let playersUpdated = 0;

    for (const team of data.equipos) {
      let teamEntity = await this.teamRepo.findOneBy({ name: team.nombre });

      // Si un equipo con ese nombre ya pertenece a un usuario, NO convertirlo en oponente IA.
      if (teamEntity && (teamEntity.userId || teamEntity.sessionId)) {
        continue;
      }


      if (!teamEntity) {
        teamEntity = new TeamEntity();
        teamEntity.id = crypto.randomUUID();
        teamEntity.name = team.nombre;
        teamsCreated++;
      }

      teamEntity.isReal = true; // Equipo IA real (Premier/LaLiga/extra) → oponente del torneo
      await this.teamRepo.save(teamEntity);

      for (const player of team.jugadores) {
        let playerEntity = await this.playerRepo.findOneBy({ name: player.nombre });

        if (playerEntity) {
          playerEntity.rating = player.rating;
          playerEntity.pace = player.ritmo;
          playerEntity.shooting = player.tiro;
          playerEntity.passing = player.pase;
          playerEntity.dribbling = player.regate;
          playerEntity.defending = player.defensa;
          playerEntity.physical = player.fisico;
          playerEntity.position = POSITION_MAP[player.posicion] ?? player.posicion;
          await this.playerRepo.save(playerEntity);
          playersUpdated++;
        } else {
          playerEntity = new PlayerEntity();
          playerEntity.id = crypto.randomUUID();
          playerEntity.name = player.nombre;
          playerEntity.nationality = 'Inglaterra';
          playerEntity.position = POSITION_MAP[player.posicion] ?? player.posicion;
          playerEntity.rating = player.rating;
          playerEntity.pace = player.ritmo;
          playerEntity.shooting = player.tiro;
          playerEntity.passing = player.pase;
          playerEntity.dribbling = player.regate;
          playerEntity.defending = player.defensa;
          playerEntity.physical = player.fisico;
          await this.playerRepo.save(playerEntity);
          playersCreated++;
        }

        const existingLink = await this.teamPlayerRepo.findOneBy({
          teamId: teamEntity.id,
          playerId: playerEntity.id,
        });

        if (!existingLink) {
          const link = new TeamPlayerEntity();
          link.id = crypto.randomUUID();
          link.teamId = teamEntity.id;
          link.playerId = playerEntity.id;
          link.isStarter = true;
          link.slotIndex = team.jugadores.indexOf(player);
          await this.teamPlayerRepo.save(link);
        }
      }
    }

    this.logger.log(`Premier League seed: ${teamsCreated} teams, ${playersCreated} created, ${playersUpdated} updated`);
  }

  private async seedLaLigaTeams() {
    const possiblePaths = [
      path.join(__dirname, 'data', 'laliga_teams.json'),
      path.join(process.cwd(), 'src', 'seed', 'data', 'laliga_teams.json'),
    ];
    const filePath = possiblePaths.find(p => fs.existsSync(p));
    if (!filePath) {
      this.logger.warn('laliga_teams.json not found, skipping La Liga seed');
      return;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data: PremierData = JSON.parse(raw);

    let teamsCreated = 0;
    let playersCreated = 0;
    let playersUpdated = 0;

    for (const team of data.equipos) {
      let teamEntity = await this.teamRepo.findOneBy({ name: team.nombre });

      // Si un equipo con ese nombre ya pertenece a un usuario, NO convertirlo en oponente IA.
      if (teamEntity && (teamEntity.userId || teamEntity.sessionId)) {
        continue;
      }

      if (!teamEntity) {
        teamEntity = new TeamEntity();
        teamEntity.id = crypto.randomUUID();
        teamEntity.name = team.nombre;
        teamsCreated++;
      }

      teamEntity.isReal = true; // Equipo IA real (Premier/LaLiga/extra) → oponente del torneo
      await this.teamRepo.save(teamEntity);

      for (const player of team.jugadores) {
        let playerEntity = await this.playerRepo.findOneBy({ name: player.nombre });

        if (playerEntity) {
          playerEntity.rating = player.rating;
          playerEntity.pace = player.ritmo;
          playerEntity.shooting = player.tiro;
          playerEntity.passing = player.pase;
          playerEntity.dribbling = player.regate;
          playerEntity.defending = player.defensa;
          playerEntity.physical = player.fisico;
          playerEntity.position = POSITION_MAP[player.posicion] ?? player.posicion;
          await this.playerRepo.save(playerEntity);
          playersUpdated++;
        } else {
          playerEntity = new PlayerEntity();
          playerEntity.id = crypto.randomUUID();
          playerEntity.name = player.nombre;
          playerEntity.nationality = 'España';
          playerEntity.position = POSITION_MAP[player.posicion] ?? player.posicion;
          playerEntity.rating = player.rating;
          playerEntity.pace = player.ritmo;
          playerEntity.shooting = player.tiro;
          playerEntity.passing = player.pase;
          playerEntity.dribbling = player.regate;
          playerEntity.defending = player.defensa;
          playerEntity.physical = player.fisico;
          await this.playerRepo.save(playerEntity);
          playersCreated++;
        }

        const existingLink = await this.teamPlayerRepo.findOneBy({
          teamId: teamEntity.id,
          playerId: playerEntity.id,
        });

        if (!existingLink) {
          const link = new TeamPlayerEntity();
          link.id = crypto.randomUUID();
          link.teamId = teamEntity.id;
          link.playerId = playerEntity.id;
          link.isStarter = true;
          link.slotIndex = team.jugadores.indexOf(player);
          await this.teamPlayerRepo.save(link);
        }
      }
    }

    this.logger.log(`La Liga seed: ${teamsCreated} teams, ${playersCreated} created, ${playersUpdated} updated`);
  }

  private async seedExtraTeams() {
    const possiblePaths = [
      path.join(__dirname, 'data', 'extra_teams.json'),
      path.join(process.cwd(), 'src', 'seed', 'data', 'extra_teams.json'),
    ];
    const filePath = possiblePaths.find(p => fs.existsSync(p));
    if (!filePath) return;

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data: PremierData = JSON.parse(raw);

    for (const team of data.equipos) {
      let teamEntity = await this.teamRepo.findOneBy({ name: team.nombre });

      // Si un equipo con ese nombre ya pertenece a un usuario, NO convertirlo en oponente IA.
      if (teamEntity && (teamEntity.userId || teamEntity.sessionId)) {
        continue;
      }

      if (!teamEntity) {
        teamEntity = new TeamEntity();
        teamEntity.id = crypto.randomUUID();
        teamEntity.name = team.nombre;
      }

      teamEntity.isReal = true; // Equipo IA real (Premier/LaLiga/extra) → oponente del torneo
      await this.teamRepo.save(teamEntity);

      for (const player of team.jugadores) {
        let playerEntity = await this.playerRepo.findOneBy({ name: player.nombre });
        if (!playerEntity) {
          playerEntity = new PlayerEntity();
          playerEntity.id = crypto.randomUUID();
          playerEntity.name = player.nombre;
          playerEntity.nationality = 'International';
          playerEntity.position = POSITION_MAP[player.posicion] ?? player.posicion;
          playerEntity.rating = player.rating;
          playerEntity.pace = player.ritmo;
          playerEntity.shooting = player.tiro;
          playerEntity.passing = player.pase;
          playerEntity.dribbling = player.regate;
          playerEntity.defending = player.defensa;
          playerEntity.physical = player.fisico;
          await this.playerRepo.save(playerEntity);
        }

        const existingLink = await this.teamPlayerRepo.findOneBy({
          teamId: teamEntity.id,
          playerId: playerEntity.id,
        });

        if (!existingLink) {
          const link = new TeamPlayerEntity();
          link.id = crypto.randomUUID();
          link.teamId = teamEntity.id;
          link.playerId = playerEntity.id;
          link.isStarter = true;
          link.slotIndex = team.jugadores.indexOf(player);
          await this.teamPlayerRepo.save(link);
        }
      }
    }
    this.logger.log('Extra teams (Bayern, PSG, City) seeded successfully');
  }
}
