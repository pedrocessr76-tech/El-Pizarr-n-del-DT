#!/usr/bin/env node
/**
 * Script de migración / carga de datos de jugadores de fútbol.
 *
 * Lee recursivamente TODOS los archivos JSON de la carpeta `Jugadores_Base_de_Datos`
 * (en la raíz del repo, una subcarpeta por liga y un JSON por equipo) y los importa
 * (UPSERT) en la tabla `players` de PostgreSQL.
 *
 * Es idempotente: se puede ejecutar varias veces sin duplicar datos, usando el `id`
 * de cada jugador como clave primaria (ON CONFLICT (id) DO UPDATE).
 *
 * Uso:
 *   node apps/server/scripts/import-players.js [--source <ruta>]
 *
 * Conexión a BD vía variables de entorno (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD,
 * DB_NAME). Usa SSL cuando DB_SSL=true (recomendado en Render).
 */

'use strict';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

function resolveSourceDir() {
  const argIndex = process.argv.indexOf('--source');
  if (argIndex !== -1 && process.argv[argIndex + 1]) {
    return process.argv[argIndex + 1];
  }
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

function normalizePlayer(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Objeto de jugador inválido');
  }
  if (!raw.id || typeof raw.id !== 'string') {
    throw new Error(`Jugador sin "id" válido: ${raw.name || 'desconocido'}`);
  }
  if (!raw.name || typeof raw.name !== 'string') {
    throw new Error(`Jugador sin "name" (id=${raw.id})`);
  }

  const position = String(raw.position || '').trim();
  if (position.length > 3) {
    throw new Error(
      `Posición "${position}" (jugador ${raw.name}) supera los 3 caracteres de la columna players.position`,
    );
  }

  const toInt = (v, field) => {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) {
      throw new Error(`Valor inválido en ${field} para "${raw.name}" (id=${raw.id})`);
    }
    return n;
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
        files.push({
          league: path.basename(path.dirname(full)),
          file: full,
          name: entry.name,
        });
      }
    }
  };
  walk(sourceDir);

  if (files.length === 0) {
    throw new Error(`No se encontraron archivos .json en ${sourceDir}`);
  }
  return files.sort((a, b) => a.file.localeCompare(b.file));
}
// ---------------------------------------------------------------------------
// Carga de datos (UPSERT)
// ---------------------------------------------------------------------------

const UPSERT_SQL = `
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

async function loadFile(client, existingIds, fileEntry) {
  const raw = fs.readFileSync(fileEntry.file, 'utf-8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error(`El archivo ${fileEntry.name} no contiene un array de jugadores`);
  }

  let inserted = 0;
  let updated = 0;

  for (const item of data) {
    const player = normalizePlayer(item);
    const wasExisting = existingIds.has(player.id);
    await client.query(UPSERT_SQL, [
      player.id,
      player.name,
      player.nationality,
      player.position,
      player.rating,
      player.pace,
      player.shooting,
      player.passing,
      player.dribbling,
      player.defending,
      player.physical,
    ]);
    existingIds.add(player.id);
    if (wasExisting) {
      updated++;
    } else {
      inserted++;
    }
  }

  return { name: fileEntry.name, players: data.length, inserted, updated };
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
    const { rows } = await client.query('SELECT id FROM players;');
    const existingIds = new Set(rows.map((r) => r.id));
    console.log(`Jugadores existentes en BD al inicio: ${existingIds.size}\n`);

    await client.query('BEGIN');

    let totalPlayers = 0;
    let totalInserted = 0;
    let totalUpdated = 0;

    for (const fileEntry of files) {
      const result = await loadFile(client, existingIds, fileEntry);
      totalPlayers += result.players;
      totalInserted += result.inserted;
      totalUpdated += result.updated;
      console.log(
        `  [${fileEntry.league}] ${fileEntry.name.padEnd(40)} -> ${result.inserted} insertado(s), ${result.updated} actualizado(s)`,
      );
    }

    await client.query('COMMIT');

    console.log('\n=== RESUMEN FINAL ===');
    console.log(`  Jugadores leídos en JSON:     ${totalPlayers}`);
    console.log(`  Nuevos insertados:            ${totalInserted}`);
    console.log(`  Actualizados (id existente):  ${totalUpdated}`);

    const { rows: countRows } = await client.query('SELECT COUNT(*) AS total FROM players;');
    console.log(`  Total de jugadores en la tabla players: ${countRows[0].total}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n[ERROR] Se revirtió la transacción:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();