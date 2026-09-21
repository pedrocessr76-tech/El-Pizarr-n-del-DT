import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlayerModule } from './player/player.module';
import { UserModule } from './user/user.module';
import { TeamModule } from './team/team.module';
import { DraftModule } from './draft/draft.module';
import { MatchModule } from './match/match.module';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './seed/seed.module';
import { NotificationsModule } from './notifications/notifications.module';
import { B2bModule, B2B_ENTITIES } from './b2b/b2b.module';
import { GAME_ENTITIES } from './game-entities';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Decide si TypeORM debe auto-sincronizar el esquema.
 *
 * - `true`/`false` explícito siempre gana (útil para docker-compose y pruebas).
 * - Sin valor explícito, `synchronize` queda habilitado sólo en desarrollo.
 *   En producción el esquema se aplica con migraciones versionadas
 *   (`DB_MIGRATIONS=true` / `B2B_DB_MIGRATIONS=true`), porque synchronize puede
 *   borrar columnas con datos sin aviso.
 */
function resolveSynchronize(explicitValue: string | undefined): boolean {
  if (explicitValue === 'true') return true;
  if (explicitValue === 'false') return false;
  return !isProduction;
}

@Module({
  imports: [
    // Rate limiting global (Fase 3): 100 peticiones/min por IP por defecto.
    // Los endpoints sensibles (login/register, reservas, generación de turnos)
    // fijan límites estrictos con @Throttle en sus controllers.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'pizarron',
      password: process.env.DB_PASSWORD || 'pizarron',
      database: process.env.DB_NAME || 'pizarron_dt',
      // Render Postgres exige TLS: habilitarlo mediante DB_SSL=true.
      ssl:
        process.env.DB_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
      // Entidades del juego declaradas de forma explícita: las de B2B viven en
      // su propia conexión ('b2b') y se registran aparte vía B2B_ENTITIES.
      entities: GAME_ENTITIES,
      synchronize: resolveSynchronize(process.env.DB_SYNCHRONIZE),
      migrations: [__dirname + '/migrations/!(*.spec|*.d).{ts,js}'],
      migrationsRun: process.env.DB_MIGRATIONS === 'true',
    }),
    TypeOrmModule.forRoot({
      name: 'b2b',
      type: 'postgres',
      // Render puede tardar en sincronizar los env vars B2B del Blueprint.
      // Durante el MVP ambas bases viven en la misma instancia PostgreSQL.
      host: process.env.B2B_DB_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.B2B_DB_PORT || process.env.DB_PORT || '5432', 10),
      username: process.env.B2B_DB_USER || process.env.DB_USER || 'canchas',
      password: process.env.B2B_DB_PASSWORD || process.env.DB_PASSWORD || 'canchas',
      database: process.env.B2B_DB_NAME || 'sistema_canchas',
      ssl:
        process.env.B2B_DB_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
      entities: B2B_ENTITIES,
      synchronize: resolveSynchronize(process.env.B2B_DB_SYNCHRONIZE),
      migrations: [__dirname + '/b2b/migrations/!(*.spec|*.d).{ts,js}'],
      migrationsRun: process.env.B2B_DB_MIGRATIONS === 'true',
    }),

    PlayerModule,
    UserModule,
    TeamModule,
    AuthModule,
    DraftModule,
    MatchModule,
    NotificationsModule,
    SeedModule,
    B2bModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

