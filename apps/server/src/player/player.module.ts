import { Module } from '@nestjs/common';
import { RepositoryPortModule } from '../persistence/repository-port.module';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PLAYER_CATALOG_REPOSITORY } from './player.repository';
import { TypeOrmPlayerCatalogRepository } from '../persistence/typeorm-player-catalog.repository';
import { PERSISTENCE_CACHE, PersistenceCache } from '../persistence/persistence-cache.service';
import { PlayerEntity } from './player.entity';
import { PlayerService } from './player.service';
import { PlayerController } from './player.controller';

@Module({
  imports: [RepositoryPortModule.forFeature([PlayerEntity]), TypeOrmModule.forFeature([PlayerEntity])],
  controllers: [PlayerController],
  providers: [
    PlayerService,
    {
      provide: PLAYER_CATALOG_REPOSITORY,
      inject: [getRepositoryToken(PlayerEntity), PERSISTENCE_CACHE],
      useFactory: (repository: Repository<PlayerEntity>, cache: PersistenceCache) => new TypeOrmPlayerCatalogRepository(repository, cache),
    },
  ],
  exports: [PlayerService],
})
export class PlayerModule {}
