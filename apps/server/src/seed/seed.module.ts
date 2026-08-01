import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerEntity, TeamEntity, TeamPlayerEntity])],
  providers: [SeedService],
})
export class SeedModule {}
