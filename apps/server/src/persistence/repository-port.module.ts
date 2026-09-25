import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { getRepositoryPortToken } from './repository.port';
import { TypeOrmRepositoryAdapter } from './typeorm-repository.adapter';
import { PERSISTENCE_CACHE, PersistenceCache } from './persistence-cache.service';
import { CacheArea } from './result-cache.config';

@Module({})
export class RepositoryPortModule {
  static forFeature(
    entities: Array<Type<ObjectLiteral>>,
    connection = 'default',
  ): DynamicModule {
    const area: CacheArea = connection === 'b2b' ? 'b2b' : 'game';
    const providers: Provider[] = entities.map((entity) => ({
      provide: getRepositoryPortToken(entity, connection),
      inject: [getRepositoryToken(entity, connection === 'default' ? undefined : connection), PERSISTENCE_CACHE],
      useFactory: (repository: Repository<ObjectLiteral>, cache: PersistenceCache) =>
        new TypeOrmRepositoryAdapter(
          repository,
          area,
          cache,
          area === 'game' && entity.name === 'PlayerEntity' ? 'player-catalog' : undefined,
        ),
    }));
    return {
      module: RepositoryPortModule,
      imports: [TypeOrmModule.forFeature(entities, connection === 'default' ? undefined : connection)],
      providers,
      exports: providers,
    };
  }
}
