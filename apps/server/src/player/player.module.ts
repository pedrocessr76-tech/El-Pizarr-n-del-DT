import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerEntity } from './player.entity';
import { PlayerService } from './player.service';
import { PlayerController } from './player.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerEntity])],
  controllers: [PlayerController],
  providers: [PlayerService],
  exports: [TypeOrmModule, PlayerService],
})
export class PlayerModule {}
