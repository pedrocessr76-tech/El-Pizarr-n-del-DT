// reflect-metadata debe cargarse antes que cualquier entidad con decoradores de TypeORM.
import 'reflect-metadata';
import { DataSource, QueryRunner } from 'typeorm';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { UserEntity } from '../user/user.entity';
import { MatchEntity } from '../match/entities/match.entity';
import { TournamentEntity } from './../match/entities/tournament.entity';
import { InitialGameSchema1724000000000 } from './1724000000000-InitialGameSchema';

/** Entidades de la base del juego (las de B2B viven en la conexión 'b2b'). */
const GAME_ENTITIES = [
  PlayerEntity,
  TeamEntity,
  TeamPlayerEntity,
  UserEntity,
  MatchEntity,
  TournamentEntity,
];

/** QueryRunner falso: registra el SQL en vez de ejecutarlo. */
function recordingQueryRunner(sink: string[]): QueryRunner {
  return {
    query: async (sql: string) => {
      sink.push(String(sql));
      return undefined;
    },
  } as unknown as QueryRunner;
}

/**
 * `buildMetadatas()` es protected en TypeORM; esta subclase lo expone para poder
 * validar la migración contra la metadata sin abrir conexión a PostgreSQL.
 */
class MetadataOnlyDataSource extends DataSource {
  buildMetadata(): Promise<void> {
    return this.buildMetadatas();
  }
}

/** Extrae el SQL de cada CREATE TABLE del script, indexado por nombre de tabla. */
function createTableStatements(queries: string[]): Map<string, string> {
  const found = new Map<string, string>();
  for (const sql of queries) {
    const match = /CREATE TABLE IF NOT EXISTS "?([A-Za-z0-9_]+)"?\s*\(([\s\S]*)\)\s*$/.exec(sql.trim());
    if (match) found.set(match[1], sql);
  }
  return found;
}

describe('Migración InitialGameSchema (baseline del esquema del juego)', () => {
  let dataSource: DataSource;
  let queries: string[] = [];
  let tables: Map<string, string>;

  beforeAll(async () => {
    // buildMetadatas() construye la metadata sin abrir conexión a la base.
    const metadataSource = new MetadataOnlyDataSource({ type: 'postgres', entities: GAME_ENTITIES });
    await metadataSource.buildMetadata();
    dataSource = metadataSource;

    queries = [];
    await new InitialGameSchema1724000000000().up(recordingQueryRunner(queries));
    tables = createTableStatements(queries);
  });

  it('ejecuta al menos un CREATE TABLE', () => {
    expect(queries.length).toBeGreaterThan(0);
    expect(tables.size).toBeGreaterThan(0);
  });

  it('crea todas las tablas declaradas por las entidades del juego', () => {
    const expected = dataSource.entityMetadatas.map((meta) => meta.tableName).sort();
    expect(expected).toEqual(['matches', 'players', 'team_players', 'teams', 'tournaments', 'users']);
    for (const tableName of expected) {
      expect(tables.has(tableName)).toBe(true);
    }
  });

  it('declara todas las columnas de cada entidad', () => {
    const missing: string[] = [];
    let checked = 0;
    for (const meta of dataSource.entityMetadatas) {
      const sql = tables.get(meta.tableName);
      expect(sql).toBeDefined();
      for (const column of meta.columns) {
        checked += 1;
        const name = column.databaseName;
        const present = sql!.includes('"' + name + '"') || new RegExp('\\b' + name + '\\b').test(sql!);
        if (!present) missing.push(meta.tableName + '.' + name);
      }
    }
    // Guarda contra un test vacío: 45 columnas repartidas en las 6 entidades del juego.
    expect(checked).toBe(45);
    expect(missing).toEqual([]);
  });

  it('es idempotente: usa CREATE TABLE IF NOT EXISTS en todas las tablas', () => {
    for (const sql of queries) {
      if (/^\s*CREATE TABLE/i.test(sql.trim())) {
        expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS/);
      }
    }
  });

  it('crea índices para las consultas calientes', () => {
    const indexed = ['idx_team_players_team', 'idx_teams_session', 'idx_matches_tournament', 'idx_tournaments_session'];
    for (const name of indexed) {
      expect(queries.some((sql) => sql.includes(name))).toBe(true);
    }
  });

  it('down elimina todas las tablas', async () => {
    const drops: string[] = [];
    await new InitialGameSchema1724000000000().down(recordingQueryRunner(drops));
    expect(drops).toHaveLength(1);
    for (const table of ['matches', 'tournaments', 'team_players', 'teams', 'players', 'users']) {
      expect(drops[0]).toContain(table);
    }
  });
});
