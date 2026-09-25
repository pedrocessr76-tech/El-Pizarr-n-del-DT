import { Repository } from 'typeorm';
import { PlayerEntity } from '../player/player.entity';
import { PersistenceCacheService } from './persistence-cache.service';
import { RedisQueryResultCache } from './redis-query-result-cache';
import { TypeOrmPlayerCatalogRepository } from './typeorm-player-catalog.repository';
import { TypeOrmRepositoryAdapter } from './typeorm-repository.adapter';

describe('PersistenceCacheService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, DB_CACHE_ENABLED: 'true', B2B_DB_CACHE_ENABLED: 'true', RESULT_CACHE_REDIS_URL: 'redis://localhost:6379' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('creates stable IDs from normalized object keys and separates datasource namespaces', () => {
    const cache = new PersistenceCacheService({} as never);
    const gameFirst = cache.cacheId('game', 'players', { position: 'GK', rating: 90 });
    const gameSameCriteria = cache.cacheId('game', 'players', { rating: 90, position: 'GK' });
    const b2bSameCriteria = cache.cacheId('b2b', 'players', { position: 'GK', rating: 90 });

    expect(gameFirst).toBe(gameSameCriteria);
    expect(gameFirst).not.toBe(b2bSameCriteria);
  });

  it('invalidates only the selected datasource group and swallows invalidation failures', async () => {
    const gameCache = { invalidateGroup: jest.fn().mockRejectedValue(new Error('redis offline')) };
    const b2bCache = { invalidateGroup: jest.fn().mockResolvedValue(undefined) };
    const cache = new PersistenceCacheService({
      game: { queryResultCache: gameCache },
      b2b: { queryResultCache: b2bCache },
    } as never);

    await expect(cache.invalidate('game', 'players')).resolves.toBeUndefined();

    expect(gameCache.invalidateGroup).toHaveBeenCalledWith('players');
    expect(b2bCache.invalidateGroup).not.toHaveBeenCalled();
  });
});

describe('RedisQueryResultCache', () => {
  function createCache() {
    const values = new Map<string, string>();
    const sets = new Map<string, Set<string>>();
    const client = {
      isReady: true,
      isOpen: false,
      on: jest.fn().mockReturnThis(),
      get: jest.fn(async (key: string) => values.get(key) ?? null),
      set: jest.fn(async (key: string, value: string) => { values.set(key, value); return 'OK'; }),
      sAdd: jest.fn(async (key: string, value: string) => {
        const entries = sets.get(key) ?? new Set<string>();
        entries.add(value);
        sets.set(key, entries);
        return 1;
      }),
      pExpire: jest.fn().mockResolvedValue(true),
      sMembers: jest.fn(async (key: string) => [...(sets.get(key) ?? [])]),
      del: jest.fn(async (keys: string | string[]) => {
        for (const key of Array.isArray(keys) ? keys : [keys]) {
          values.delete(key);
          sets.delete(key);
        }
        return 1;
      }),
      scanIterator: jest.fn(async function* () { yield [...values.keys()]; }),
      quit: jest.fn().mockResolvedValue('OK'),
    };
    const cache = new RedisQueryResultCache('pizarron:game', 'redis://localhost:6379');
    (cache as any).client = client;
    (cache as any).available = true;
    return { cache, client, values };
  }

  it('stores cache entries with a finite TTL and registers their invalidation group', async () => {
    const { cache, client } = createCache();
    const id = 'pizarron:game:player-catalog:variant-1';
    const options = { identifier: id, duration: 60_000, time: Date.now(), result: '[{"id":"p1"}]' };

    await cache.storeInCache(options, undefined);

    expect(client.set).toHaveBeenCalledWith(id, JSON.stringify(options), { expiration: { type: 'PX', value: 60_000 } });
    expect(client.sAdd).toHaveBeenCalledWith('pizarron:game:group:player-catalog', id);
    expect(client.pExpire).toHaveBeenCalledWith('pizarron:game:group:player-catalog', 60_000);
    await expect(cache.getFromCache({ identifier: id, duration: 60_000 })).resolves.toEqual(options);
  });

  it('invalidates all variants in a group without touching another datasource namespace', async () => {
    const { cache, client, values } = createCache();
    const first = 'pizarron:game:player-catalog:variant-1';
    const second = 'pizarron:game:player-catalog:variant-2';
    values.set(first, '{}');
    values.set(second, '{}');
    await client.sAdd('pizarron:game:group:player-catalog', first);
    await client.sAdd('pizarron:game:group:player-catalog', second);

    await cache.invalidateGroup('player-catalog');

    expect(values.has(first)).toBe(false);
    expect(values.has(second)).toBe(false);
    expect(client.del).toHaveBeenCalledWith([first, second]);
  });

  it('treats an expired entry as a miss and Redis read failures as database misses', async () => {
    const { cache, client } = createCache();
    const oldEntry = { identifier: 'pizarron:game:players:old', duration: 1, time: Date.now() - 100, result: '[]' };
    await cache.storeInCache(oldEntry, undefined);
    await expect(cache.getFromCache(oldEntry)).resolves.toBeUndefined();

    client.get.mockRejectedValueOnce(new Error('redis offline'));
    await expect(cache.getFromCache({ identifier: 'pizarron:game:players:miss', duration: 60_000 })).resolves.toBeUndefined();
  });
});

describe('cache opt-in on repository reads', () => {
  it('assigns distinct cache IDs for different catalog filters and honors the TTL', async () => {
    const query = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      cache: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const typeormRepository = { createQueryBuilder: jest.fn(() => query) } as unknown as Repository<PlayerEntity>;
    const cacheIds: string[] = [];
    const persistenceCache = {
      isEnabled: jest.fn().mockReturnValue(true),
      ttlMs: jest.fn().mockReturnValue(30_000),
      cacheId: jest.fn((_area: string, _group: string, criteria: unknown) => {
        const id = JSON.stringify(criteria);
        cacheIds.push(id);
        return id;
      }),
    };
    const catalog = new TypeOrmPlayerCatalogRepository(typeormRepository, persistenceCache as never);

    await catalog.findCatalog({ position: 'GK' });
    await catalog.findCatalog({ position: 'DEF' });

    expect(cacheIds[0]).not.toBe(cacheIds[1]);
    expect(query.cache).toHaveBeenNthCalledWith(1, cacheIds[0], 30_000);
    expect(query.cache).toHaveBeenNthCalledWith(2, cacheIds[1], 30_000);
  });

  it('does not cache reads by default and bypasses explicit cache requests inside a Unit of Work adapter', async () => {
    const repository = { find: jest.fn().mockResolvedValue([]) } as unknown as Repository<PlayerEntity>;
    const persistenceCache = {
      isEnabled: jest.fn().mockReturnValue(true),
      cacheId: jest.fn().mockReturnValue('cache-id'),
      ttlMs: jest.fn().mockReturnValue(60_000),
    };
    const normalAdapter = new TypeOrmRepositoryAdapter(repository, 'game', persistenceCache as never);
    const transactionAdapter = new TypeOrmRepositoryAdapter(repository, 'game', persistenceCache as never, undefined, undefined, false);

    await normalAdapter.find({ where: { id: 'p1' } });
    expect(repository.find).toHaveBeenLastCalledWith(expect.not.objectContaining({ cache: expect.anything() }));
    await transactionAdapter.find({ where: { id: 'p1' }, cache: { group: 'player-catalog' } });
    expect(repository.find).toHaveBeenLastCalledWith(expect.not.objectContaining({ cache: expect.anything() }));
    expect(persistenceCache.cacheId).not.toHaveBeenCalled();
  });

  it('invalidates only after a successful direct player write', async () => {
    const repository = {
      save: jest.fn().mockResolvedValue({ id: 'p1' }),
    } as unknown as Repository<PlayerEntity>;
    const invalidate = jest.fn().mockResolvedValue(undefined);
    const adapter = new TypeOrmRepositoryAdapter(repository, 'game', { invalidate } as never, 'player-catalog');

    await adapter.save({ id: 'p1' } as PlayerEntity);
    expect(invalidate).toHaveBeenCalledWith('game', 'player-catalog');

    (repository.save as jest.Mock).mockRejectedValueOnce(new Error('database failed'));
    await expect(adapter.save({ id: 'p1' } as PlayerEntity)).rejects.toThrow('database failed');
    expect(invalidate).toHaveBeenCalledTimes(1);
  });
});
