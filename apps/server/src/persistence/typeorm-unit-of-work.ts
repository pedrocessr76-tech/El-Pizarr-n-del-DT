import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { RepositorySession, UnitOfWork } from './repository.port';
import { TypeOrmRepositoryAdapter } from './typeorm-repository.adapter';
import { CacheArea } from './result-cache.config';
import { PersistenceCache } from './persistence-cache.service';

/** Creates repository adapters only from the manager owned by this transaction. */
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cacheArea: CacheArea,
    private readonly persistenceCache: PersistenceCache,
  ) {}

  async execute<T>(work: (repositories: RepositorySession) => Promise<T>): Promise<T> {
    const changedGroups = new Set<string>();
    const result = await this.dataSource.transaction(async (manager) =>
      work({
        get: <Entity extends ObjectLiteral>(entity: EntityTarget<Entity>) =>
          new TypeOrmRepositoryAdapter(
            manager.getRepository(entity),
            this.cacheArea,
            this.persistenceCache,
            this.cacheArea === 'game' && typeof entity === 'function' && entity.name === 'PlayerEntity'
              ? 'player-catalog'
              : undefined,
            (group) => { changedGroups.add(group); },
            false,
          ),
      }),
    );
    await Promise.all([...changedGroups].map((group) => this.persistenceCache.invalidate(this.cacheArea, group)));
    return result;
  }
}
