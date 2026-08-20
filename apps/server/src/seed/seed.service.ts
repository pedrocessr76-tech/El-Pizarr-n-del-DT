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
    await this.syncCatalogFromDisk();
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

  // -------------------------------------------------------------------------
  // Sincronización del catálogo desde Jugadores_Base_de_Datos (en el repo)
  // -------------------------------------------------------------------------

  /** Nombre de la carpeta de datos (raíz del repo). */
  private static readonly DATA_DIR_NAME = 'Jugadores_Base_de_Datos';

  /** Busca la carpeta de datos caminando hacia arriba desde process.cwd(). */
  private resolveDataDir(): string {
    if (process.env.DATA_DIR) return process.env.DATA_DIR;

    let dir = process.cwd();
    for (let i = 0; i < 8; i++) {
      const candidate = path.join(dir, SeedService.DATA_DIR_NAME);
      if (fs.existsSync(candidate)) return candidate;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return path.join(process.cwd(), SeedService.DATA_DIR_NAME);
  }

  /** Recorre todas las subcarpetas y devuelve los archivos .json (cada uno es una plantilla/equipo). */
  private collectJsonFiles(sourceDir: string): Array<{ league: string; file: string; name: string }> {
    if (!fs.existsSync(sourceDir)) {
      this.logger.warn(`No se encontró la carpeta de datos: ${sourceDir}. Se omite la sincronización del catálogo.`);
      return [];
    }

    const files: Array<{ league: string; file: string; name: string }> = [];
    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name.toLowerCase().endsWith?.('.json') || entry.name.toLowerCase().endsWith('.json')) {
          files.push({
            league: path.basename(path.dirname(full)),
            file: full,
            name: entry.name,
          });
        }
      }
    };
    walk(sourceDir);
    return files.sort((a, b) => a.file.localeCompare(b.file));
  }

  /** Convierte el nombre del archivo en nombre de equipo (título por palabra). */
  private deriveTeamName(fileName: string): string {
    let base = fileName.replace(/\.json$/i, '');
    if (/^arsenal_premier_league/i.test(base)) return 'Arsenal';
    return base
      .split('_')
      .filter(Boolean)
      .map(tok => tok.charAt(0).toUpperCase() + tok.slice(1))
      .join(' ');
  }

  /** Normaliza un jugador bruto al shape de la entidad. */
  private normalizePlayer(raw: any) {
    if (!raw || typeof raw !== 'object') throw new Error('Objeto de jugador inválido');
    if (!raw.id || typeof raw.id !== 'string') throw new Error(`Jugador sin "id": ${raw.name || 'desconocido'}`);
    if (!raw.name || typeof raw.name !== 'string') throw new Error(`Jugador sin "name" (id=${raw.id})`);

    const position = String(raw.position || '').trim();
    if (position.length > 3) throw new Error(`Posición "${position}" (${raw.name}) supera los 3 caracteres`);

    const toInt = (v: any, field: string) => {
      const n = Math.round(Number(v));
      return Number.isFinite(n) ? n : 50;
    };

    return {
      id: raw.id,
      name: raw.name,
      nationality: String(raw.nationality || '').trim() || 'Desconocida',
      position: position || 'MC',
      rating: toInt(raw.rating, 'rating'),
      pace: toInt(raw.pace, 'pace'),
      shooting: toInt(raw.shooting, 'shooting'),
      passing: toInt(raw.passing, 'passing'),
      dribbling: toInt(raw.dribbling, 'dribbling'),
      defending: toInt(raw.defending, 'defending'),
      physical: toInt(raw.physical, 'physical'),
    };
  }

  /** Nombre normalizado para detectar equipos duplicados: minúsculas, sin acentos, sin FC/CF. */
  private normName(name: string): string {
    return (name || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(?:fc|cf|club|futbol|fútbol)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * UPSERT idempotente de todos los jugadores/equipos de la carpeta Jugadores_Base_de_Datos.
   * Se ejecuta en cada arranque: si a futuro se agregan jugadores al repo y se reinicia,
   * quedan disponibles en la BD.
   */
  private async syncCatalogFromDisk() {
    const sourceDir = this.resolveDataDir();
    const files = this.collectJsonFiles(sourceDir);
    if (files.length === 0) return;

    this.logger.log(`🔄 Sincronizando catálogo desde ${sourceDir} (${files.length} plantillas/equipos)...`);

    let playersInserted = 0;
    let playersUpdated = 0;
    let teamsCreated = 0;
    let linksCreated = 0;

    // Conjunto de IDs que existen en el catálogo de la carpeta (fuente de verdad).
    const catalogIds = new Set<string>();
    const byNorm = new Map<string, string>();
    const existingTeams = await this.teamRepo.find();
    for (const t of existingTeams) byNorm.set(this.normName(t.name), t.id);

    for (const fileEntry of files) {
      try {
        const raw = fs.readFileSync(fileEntry.file, 'utf-8');
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) {
          this.logger.warn(`Omitido ${fileEntry.name}: no contiene un array de jugadores.`);
          continue;
        }

        const teamName = this.deriveTeamName(fileEntry.name);
        const normKey = this.normName(teamName);
        let teamId = byNorm.get(normKey);

        if (!teamId) {
          const team = new TeamEntity();
          team.id = crypto.randomUUID();
          team.name = teamName;
          team.isReal = true;
          const saved = await this.teamRepo.save(team);
          teamId = saved.id;
          byNorm.set(normKey, teamId);
          teamsCreated++;
        }

        const normalized = data
          .map(rawPlayer => this.normalizePlayer(rawPlayer))
          .sort((a, b) => b.rating - a.rating);

        for (const p of normalized) {
          catalogIds.add(p.id);
          let entity = await this.playerRepo.findOneBy({ id: p.id });
          if (entity) {
            entity.name = p.name;
            entity.nationality = p.nationality;
            entity.position = p.position;
            entity.rating = p.rating;
            entity.pace = p.pace;
            entity.shooting = p.shooting;
            entity.passing = p.passing;
            entity.dribbling = p.dribbling;
            entity.defending = p.defending;
            entity.physical = p.physical;
            await this.playerRepo.save(entity);
            playersUpdated++;
          } else {
            entity = this.playerRepo.create({
              id: p.id,
              name: p.name,
              nationality: p.nationality,
              position: p.position,
              rating: p.rating,
              pace: p.pace,
              shooting: p.shooting,
              passing: p.passing,
              dribbling: p.dribbling,
              defending: p.defending,
              physical: p.physical,
            });
            await this.playerRepo.save(entity);
            playersInserted++;
          }
        }

        await this.teamPlayerRepo.delete({ teamId });
        for (let i = 0; i < normalized.length; i++) {
          const link = new TeamPlayerEntity();
          link.id = crypto.randomUUID();
          link.teamId = teamId;
          link.playerId = normalized[i].id;
          link.isStarter = i < 11;
          link.slotIndex = i;
          await this.teamPlayerRepo.save(link);
          linksCreated++;
        }
      } catch (err: any) {
        this.logger.error(`Falló la sincronización de ${fileEntry.name}: ${err.message}`);
      }
    }

    this.logger.log(
      `Catálogo sincronizado: ${playersInserted} jugadores creados, ${playersUpdated} actualizados, ` +
        `${teamsCreated} equipos creados, ${linksCreated} enlaces de plantilla.`,
    );

    // Limpieza de jugadores huérfanos: ya no existen en la carpeta del catálogo
    // ("jugadores seed" de versiones anteriores) y tampoco pertenecen a ningún equipo
    // (para no romper equipos que hayan armado los usuarios).
    const linkRows = await this.teamPlayerRepo.find();
    const linkedPlayerIds = new Set(linkRows.map(l => l.playerId));
    const allPlayers = (await this.playerRepo.find({ select: { id: true } })).map(r => r.id);
    const orphanIds = allPlayers.filter(id => !catalogIds.has(id) && !linkedPlayerIds.has(id));

    if (orphanIds.length) {
      await this.playerRepo.delete(orphanIds);
      this.logger.log(`🧹 Eliminados ${orphanIds.length} jugadores huérfanos que no están en el catálogo actual.`);
    }
  }
}
