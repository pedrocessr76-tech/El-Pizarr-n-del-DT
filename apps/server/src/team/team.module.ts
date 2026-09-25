import { Module } from '@nestjs/common';
import { RepositoryPortModule } from '../persistence/repository-port.module';
import { TeamEntity } from './team.entity';
import { TeamPlayerEntity } from './team-player.entity';

@Module({
  imports: [RepositoryPortModule.forFeature([TeamEntity, TeamPlayerEntity])],
  exports: [],
})
export class TeamModule {}
