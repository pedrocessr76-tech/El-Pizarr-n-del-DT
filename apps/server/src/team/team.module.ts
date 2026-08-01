import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamEntity } from './team.entity';
import { TeamPlayerEntity } from './team-player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeamEntity, TeamPlayerEntity])],
  exports: [TypeOrmModule],
})
export class TeamModule {}
