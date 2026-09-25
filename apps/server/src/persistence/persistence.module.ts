import { Global, Module } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TypeOrmUnitOfWork } from './typeorm-unit-of-work';
import { PERSISTENCE_CACHE, PersistenceCacheService } from './persistence-cache.service';

export const GAME_UNIT_OF_WORK = Symbol('GAME_UNIT_OF_WORK');
export const B2B_UNIT_OF_WORK = Symbol('B2B_UNIT_OF_WORK');
export const B2B_DATABASE_HEALTH = Symbol('B2B_DATABASE_HEALTH');

export interface DatabaseHealthCheck {
  check(): Promise<void>;
}

@Global()
@Module({
  providers: [
    {
      provide: PERSISTENCE_CACHE,
      inject: [getDataSourceToken(), getDataSourceToken('b2b')],
      useFactory: (game: DataSource, b2b: DataSource) => new PersistenceCacheService({ game, b2b }),
    },
    {
      provide: GAME_UNIT_OF_WORK,
      inject: [getDataSourceToken(), PERSISTENCE_CACHE],
      useFactory: (dataSource: DataSource, cache: PersistenceCacheService) => new TypeOrmUnitOfWork(dataSource, 'game', cache),
    },
    {
      provide: B2B_UNIT_OF_WORK,
      inject: [getDataSourceToken('b2b'), PERSISTENCE_CACHE],
      useFactory: (dataSource: DataSource, cache: PersistenceCacheService) => new TypeOrmUnitOfWork(dataSource, 'b2b', cache),
    },
    {
      provide: B2B_DATABASE_HEALTH,
      inject: [getDataSourceToken('b2b')],
      useFactory: (dataSource: DataSource): DatabaseHealthCheck => ({
        check: async () => { await dataSource.query('SELECT 1'); },
      }),
    },
  ],
  exports: [GAME_UNIT_OF_WORK, B2B_UNIT_OF_WORK, B2B_DATABASE_HEALTH, PERSISTENCE_CACHE],
})
export class PersistenceModule {}
