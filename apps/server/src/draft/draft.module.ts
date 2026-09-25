import { Module } from '@nestjs/common';
import { RepositoryPortModule } from '../persistence/repository-port.module';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { MatchEntity } from '../match/entities/match.entity';
import { TournamentEntity } from '../match/entities/tournament.entity';
import { DraftService } from './draft.service';
import { DraftController } from './draft.controller';

@Module({
  imports: [RepositoryPortModule.forFeature([PlayerEntity, TeamEntity, TeamPlayerEntity, MatchEntity, TournamentEntity])],
  controllers: [DraftController],
  providers: [DraftService],
})
export class DraftModule {}
