import { Module } from '@nestjs/common';
import { RepositoryPortModule } from '../persistence/repository-port.module';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { MatchEntity } from './entities/match.entity';
import { TournamentEntity } from './entities/tournament.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [RepositoryPortModule.forFeature([PlayerEntity, TeamEntity, TeamPlayerEntity, MatchEntity, TournamentEntity]), NotificationsModule],

  controllers: [MatchController],
  providers: [MatchService],
  exports: [],
})
export class MatchModule {}
