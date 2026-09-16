import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline del esquema del juego (El Pizarrón del DT).
 *
 * Antes de esta migración el esquema se creaba con `synchronize: true`, lo que
 * hacía imposible versionar cambios y riesgoso desplegar en producción.
 *
 * Es idempotente a propósito (CREATE TABLE IF NOT EXISTS): sobre una base que ya
 * tenía las tablas creadas por synchronize, la migración sólo queda registrada en
 * `migrations` sin tocar los datos existentes.
 */
export class InitialGameSchema1724000000000 implements MigrationInterface {
  name = 'InitialGameSchema1724000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), username varchar(50) NOT NULL UNIQUE, password varchar NOT NULL, "createdAt" timestamp NOT NULL DEFAULT now())`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS players (id text PRIMARY KEY, name varchar(100) NOT NULL, nationality varchar(50) NOT NULL, position varchar(3) NOT NULL, rating integer NOT NULL DEFAULT 50, pace integer NOT NULL DEFAULT 50, shooting integer NOT NULL DEFAULT 50, passing integer NOT NULL DEFAULT 50, dribbling integer NOT NULL DEFAULT 50, defending integer NOT NULL DEFAULT 50, physical integer NOT NULL DEFAULT 50)`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS teams (id text PRIMARY KEY, name varchar(100) NOT NULL, "userId" varchar(255), "sessionId" text, "isReal" boolean NOT NULL DEFAULT false, "createdAt" timestamp NOT NULL DEFAULT now())`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS team_players (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "teamId" varchar(255) NOT NULL, "playerId" varchar(255) NOT NULL, "isStarter" boolean NOT NULL DEFAULT false, "slotIndex" integer NOT NULL DEFAULT 0)`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS tournaments (id text PRIMARY KEY, "userId" varchar(255), "sessionId" text, "userTeamId" varchar(255) NOT NULL, status varchar(20) NOT NULL DEFAULT 'IN_PROGRESS', "currentRound" varchar(20) NOT NULL DEFAULT 'OCTAVOS', "createdAt" timestamp NOT NULL DEFAULT now())`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS matches (id text PRIMARY KEY, "tournamentId" varchar(50), round varchar(20) NOT NULL DEFAULT 'OCTAVOS', "userId" varchar(255), "sessionId" text, "homeTeamId" varchar(255) NOT NULL, "awayTeamId" varchar(255) NOT NULL, "homeScore" integer NOT NULL DEFAULT 0, "awayScore" integer NOT NULL DEFAULT 0, status varchar(20) NOT NULL DEFAULT 'PENDING', "winnerId" varchar(255), "summaryJson" text)`,
    );

    // Índices de las consultas calientes (draft, historial y limpieza de invitados).
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_team_players_team ON team_players ("teamId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_teams_session ON teams ("sessionId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_teams_user ON teams ("userId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches ("tournamentId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_matches_session ON matches ("sessionId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_tournaments_session ON tournaments ("sessionId")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS matches, tournaments, team_players, teams, players, users CASCADE');
  }
}
