import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { DraftService } from './draft.service';
import { DraftController } from './draft.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerEntity, TeamEntity, TeamPlayerEntity])],
  controllers: [DraftController],
  providers: [DraftService],
})
export class DraftModule {}
