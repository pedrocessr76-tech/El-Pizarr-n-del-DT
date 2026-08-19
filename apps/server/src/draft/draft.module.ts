import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { MatchEntity } from '../match/entities/match.entity';
import { TournamentEntity } from '../match/entities/tournament.entity';
import { DraftService } from './draft.service';
import { DraftController } from './draft.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerEntity, TeamEntity, TeamPlayerEntity, MatchEntity, TournamentEntity])],
  controllers: [DraftController],
  providers: [DraftService],
})
export class DraftModule {}
