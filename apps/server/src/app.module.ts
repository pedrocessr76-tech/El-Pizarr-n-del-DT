import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    TypeOrmModule.forRoot({
      name: 'b2b',
      type: 'postgres',
      host: process.env.B2B_DB_HOST || 'localhost',
      port: parseInt(process.env.B2B_DB_PORT || '5432', 10),
      username: process.env.B2B_DB_USER || 'canchas',
      password: process.env.B2B_DB_PASSWORD || 'canchas',
      database: process.env.B2B_DB_NAME || 'sistema_canchas',
      ssl:
        process.env.B2B_DB_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
      entities: B2B_ENTITIES,
      synchronize: process.env.B2B_DB_SYNCHRONIZE !== 'false',
      migrations: [__dirname + '/b2b/migrations/*{.ts,.js}'],
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
  providers: [AppService],
})
export class AppModule {}

