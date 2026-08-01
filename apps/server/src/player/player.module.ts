import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerEntity } from './player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerEntity])],
  exports: [TypeOrmModule],
})
export class PlayerModule {}
