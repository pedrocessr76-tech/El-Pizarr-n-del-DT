import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { B2B_ENTITIES } from '../b2b/b2b.module';

/**
 * DataSource de la base B2B (Sistema Canchas), para la CLI de TypeORM
 * (`npm run b2b:migration:run`). La app lo replica en `app.module.ts`.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.B2B_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.B2B_DB_PORT || process.env.DB_PORT || '5432', 10),
  username: process.env.B2B_DB_USER || process.env.DB_USER || 'canchas',
  password: process.env.B2B_DB_PASSWORD || process.env.DB_PASSWORD || 'canchas',
  database: process.env.B2B_DB_NAME || 'sistema_canchas',
  ssl: process.env.B2B_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: B2B_ENTITIES,
  migrations: [__dirname + '/migrations/!(*.spec|*.d).{ts,js}'],
});
