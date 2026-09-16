import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { GAME_ENTITIES } from './game-entities';

/**
 * DataSource de la base del juego, para la CLI de TypeORM
 * (`npm run migration:run`). La app lo replica en `app.module.ts`.
 *
 * Las entidades de B2B se excluyen: viven en su propia conexión (`b2b`).
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'pizarron',
  password: process.env.DB_PASSWORD || 'pizarron',
  database: process.env.DB_NAME || 'pizarron_dt',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // El patrón `!(*.spec|*.d)` excluye los tests y las declaraciones de tipos:
  // el glob de TypeORM ignora los patrones negados con `!` al inicio, así que
  // sin el extglob cargaba los `*.spec.js` y el CLI fallaba con
  // "describe is not defined".
  entities: GAME_ENTITIES,
  migrations: [__dirname + '/migrations/!(*.spec|*.d).{ts,js}'],
});
