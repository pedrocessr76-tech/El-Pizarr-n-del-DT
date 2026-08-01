import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { MatchEntity } from './entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerEntity, TeamEntity, TeamPlayerEntity, MatchEntity])],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [TypeOrmModule],
})
export class MatchModule {}
