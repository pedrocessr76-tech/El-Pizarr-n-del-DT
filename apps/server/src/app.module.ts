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
    PlayerModule,
    UserModule,
    TeamModule,
    AuthModule,
    DraftModule,
    MatchModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

