#!/usr/bin/env node
/**
 * Carga los equipos y sus plantillas desde la carpeta `Jugadores_Base_de_Datos`
 * (en la raíz del repo, una subcarpeta por liga y un JSON por equipo) a la base.
 *
 * Comportamiento:
 *  - Alinea el esquema de la tabla `teams` (idempotente, igual que las entidades).
 *  - Si ya existe un equipo con el mismo nombre normalizado (sin acentos, sin "FC/CF"),
 *    lo ELIMINA (plantillas, partidos, torneos y jugadores huérfanos asociados) y carga el nuevo.
 *  - Los 11 mejores jugadores por rating se marcan como titulares (slotIndex 0..10);
 *    el resto pasan como suplentes (slotIndex 11+).
 *  - Idempotente: puede ejecutarse varias veces.
 *
 * Uso:
 *   node apps/server/scripts/load-elite-teams.js [--source <ruta>]
 */

'use strict';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// La carpeta de datos vive en la raíz del repo. Se resuelve relativo al proyecto.
function resolveSourceDir() {
  const argIndex = process.argv.indexOf('--source');
  if (argIndex !== -1 && process.argv[argIndex + 1]) return process.argv[argIndex + 1];
  if (process.env.DATA_DIR) return process.env.DATA_DIR;

  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, 'Jugadores_Base_de_Datos');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.join(process.cwd(), 'Jugadores_Base_de_Datos');
}

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'pizarron',
  password: process.env.DB_PASSWORD || 'pizarron',
  database: process.env.DB_NAME || 'pizarron_dt',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function titleCaseToken(token) {
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function deriveTeamName(fileName) {
  let base = fileName.replace(/\.json$/i, '');
  if (/^arsenal_premier_league/i.test(base)) return 'Arsenal';
  return base.split('_').map(titleCaseToken).join(' ');
}

// Nombre normalizado para detectar duplicados: minúsculas, sin acentos,
// sin "FC"/"CF" como palabra suelta y con espacios colapsados.
function normName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(?:fc|cf|club|futbol|fútbol)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Recorre recursivamente todas las ligas (subcarpetas) y recoge los .json. */
function collectJsonFiles(sourceDir) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Directorio de origen no encontrado: ${sourceDir}`);
  }

  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.toLowerCase().endsWith('.json')) {
        files.push({ league: path.basename(path.dirname(full)), file: full, name: entry.name });
      }
    }
  };
  walk(sourceDir);
  return files.sort((a, b) => a.file.localeCompare(b.file));
}

function normalizePlayer(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Objeto de jugador inválido');
  if (!raw.id || typeof raw.id !== 'string') throw new Error(`Jugador sin "id": ${raw.name || 'desconocido'}`);
  if (!raw.name || typeof raw.name !== 'string') throw new Error(`Jugador sin "name" (id=${raw.id})`);

  const position = String(raw.position || '').trim();
  if (position.length > 3) throw new Error(`Posición "${position}" (${raw.name}) supera los 3 caracteres`);

  const toInt = (v, field) => {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) throw new Error(`Valor inválido en ${field} para "${raw.name}"`);
    return n;
  };

  return {
    id: String(raw.id),
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

// ---------------------------------------------------------------------------
// Carga (UPSERT de jugadores, creación de equipos y plantillas)
// ---------------------------------------------------------------------------

const UPSERT_PLAYER_SQL = `
  INSERT INTO players
    (id, name, nationality, position, rating, pace, shooting, passing, dribbling, defending, physical)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    nationality = EXCLUDED.nationality,
    position = EXCLUDED.position,
    rating = EXCLUDED.rating,
    pace = EXCLUDED.pace,
    shooting = EXCLUDED.shooting,
    passing = EXCLUDED.passing,
    dribbling = EXCLUDED.dribbling,
    defending = EXCLUDED.defending,
    physical = EXCLUDED.physical
`;

const INSERT_TEAM_SQL = `
  INSERT INTO teams (id, name, "userId", "sessionId", "isReal", "createdAt")
  VALUES ($1, $2, NULL, NULL, TRUE, NOW())
`;

const INSERT_LINK_SQL = `
  INSERT INTO team_players (id, "teamId", "playerId", "isStarter", "slotIndex")
  VALUES ($1, $2, $3, $4, $5)
`;

// Alinea el esquema con las entidades TypeORM (idempotente).
const ENSURE_SCHEMA_SQL = [
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS "sessionId" text`,
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS "isReal" boolean NOT NULL DEFAULT false`,
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT NOW()`,
];

async function replaceTeam(client, existingIds, name) {
  if (existingIds.length === 0) return;

  const { rows: linkRows } = await client.query(
    `SELECT "playerId" FROM team_players WHERE "teamId" = ANY($1)`,
    [existingIds],
  );
  const replacedPlayerIds = [...new Set(linkRows.map((r) => r.playerId))];

  await client.query(`DELETE FROM matches WHERE "homeTeamId" = ANY($1) OR "awayTeamId" = ANY($1)`, [existingIds]);
  await client.query(`DELETE FROM tournaments WHERE "userTeamId" = ANY($1)`, [existingIds]);
  await client.query(`DELETE FROM team_players WHERE "teamId" = ANY($1)`, [existingIds]);

  if (replacedPlayerIds.length) {
    const { rows: still } = await client.query(
      `SELECT DISTINCT "playerId" FROM team_players WHERE "playerId" = ANY($1)`,
      [replacedPlayerIds],
    );
    const stillSet = new Set(still.map((r) => r.playerId));
    const orphanPlayerIds = replacedPlayerIds.filter((id) => !stillSet.has(id));
    if (orphanPlayerIds.length) {
      await client.query(`DELETE FROM players WHERE id = ANY($1)`, [orphanPlayerIds]);
    }
  }

  await client.query(`DELETE FROM teams WHERE id = ANY($1)`, [existingIds]);
}

async function loadTeam(client, fileEntry) {
  const raw = fs.readFileSync(fileEntry.file, 'utf-8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error(`El archivo ${fileEntry.name} no contiene un array de jugadores`);
  }

  const name = deriveTeamName(fileEntry.name);
  const players = data.map(normalizePlayer);
  const teamId = crypto.randomUUID();

  await client.query(INSERT_TEAM_SQL, [teamId, name]);

  const sorted = [...players].sort((a, b) => b.rating - a.rating);
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    await client.query(UPSERT_PLAYER_SQL, [
      p.id, p.name, p.nationality, p.position, p.rating,
      p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical,
    ]);
    const isStarter = i < 11;
    await client.query(INSERT_LINK_SQL, [crypto.randomUUID(), teamId, p.id, isStarter, i]);
  }

  return { name, players: players.length, starters: Math.min(11, sorted.length) };
}
async function main() {
  const sourceDir = resolveSourceDir();
  console.log(`Directorio de origen: ${sourceDir}`);
  console.log(`Base de datos: ${DB_CONFIG.user}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}\n`);

  const files = collectJsonFiles(sourceDir);
  console.log(`Archivos JSON encontrados: ${files.length}\n`);

  const client = new Client(DB_CONFIG);
  await client.connect();

  try {
    // 1) Alinear esquema (idempotente)
    for (const sql of ENSURE_SCHEMA_SQL) {
      await client.query(sql);
    }

    // 2) Mapa de equipos existentes por nombre normalizado (para reemplazar duplicados)
    const { rows: existingTeams } = await client.query(`SELECT id, name FROM teams`);
    const byNorm = new Map();
    for (const t of existingTeams) {
      const key = normName(t.name);
      if (!byNorm.has(key)) byNorm.set(key, []);
      byNorm.get(key).push(t.id);
    }

    await client.query('BEGIN');

    // 3) Cargar todos los equipos (reemplazando duplicados por nombre normalizado)
    let replaced = 0;
    for (const fileEntry of files) {
      const name = deriveTeamName(fileEntry.name);
      const key = normName(name);
      const dupIds = byNorm.get(key) || [];

      if (dupIds.length) {
        await replaceTeam(client, dupIds, name);
        replaced += dupIds.length;
        byNorm.delete(key);
      }

      const result = await loadTeam(client, fileEntry);
      console.log(`  [${fileEntry.league}] ${result.name.padEnd(38)} -> ${result.players} jugadores (${result.starters} titulares)`);
    }

    // 4) Conservar como equipos IA los del "extra seed" que no están en este set
    await client.query(
      `UPDATE teams SET "isReal" = TRUE WHERE "isReal" = FALSE AND "userId" IS NULL ` +
        `AND name IN ('Bayern Munich', 'Paris Saint-Germain')`,
    );

    // 5) Limpieza de equipos huérfanos "Mi Equipo" (userId NULL, no reales, sin sesión)
    const { rows: orphans } = await client.query(
      `SELECT id, name FROM teams WHERE "userId" IS NULL AND "isReal" = FALSE AND "sessionId" IS NULL`,
    );
    if (orphans.length) {
      const oids = orphans.map((r) => r.id);
      await client.query(`DELETE FROM matches WHERE "homeTeamId" = ANY($1) OR "awayTeamId" = ANY($1)`, [oids]);
      await client.query(`DELETE FROM tournaments WHERE "userTeamId" = ANY($1)`, [oids]);
      await client.query(`DELETE FROM team_players WHERE "teamId" = ANY($1)`, [oids]);
      await client.query(`DELETE FROM teams WHERE id = ANY($1)`, [oids]);
      console.log(`\n[LIMPIEZA] ${orphans.length} equipos huérfanos eliminados: ${orphans.map((r) => r.name).join(', ')}`);
    }

    // 6) Quitar torneos sin partidos (residuos de equipos reemplazados)
    await client.query(
      `DELETE FROM tournaments WHERE id NOT IN ` +
        `(SELECT DISTINCT "tournamentId" FROM matches WHERE "tournamentId" IS NOT NULL)`,
    );

    await client.query('COMMIT');

    // 7) Resumen final
    const teamStats = await client.query(
      `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE "isReal" = TRUE) AS ia FROM teams`,
    );
    const playerStats = await client.query(`SELECT COUNT(*) AS total FROM players`);
    const linkStats = await client.query(`SELECT COUNT(*) AS total FROM team_players`);
    const matchesStats = await client.query(`SELECT COUNT(*) AS total FROM matches`);
    const tournamentStats = await client.query(`SELECT COUNT(*) AS total FROM tournaments`);

    console.log('\n=== RESUMEN FINAL ===');
    console.log(`  Equipos cargados:      ${files.length}`);
    console.log(`  Equipos reemplazados:  ${replaced}`);
    console.log(`  Total equipos en BD:   ${teamStats.rows[0].total} (${teamStats.rows[0].ia} IA para el torneo)`);
    console.log(`  Total jugadores:       ${playerStats.rows[0].total}`);
    console.log(`  Enlaces team_players:  ${linkStats.rows[0].total}`);
    console.log(`  Partidos en BD:        ${matchesStats.rows[0].total}`);
    console.log(`  Torneos en BD:         ${tournamentStats.rows[0].total}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n[ERROR] Se revirtió la transacción:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();