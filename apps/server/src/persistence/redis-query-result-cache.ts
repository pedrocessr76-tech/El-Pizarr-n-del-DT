import { Logger } from '@nestjs/common';
import { createClient } from 'redis';
import { QueryRunner } from 'typeorm';
import { QueryResultCache } from 'typeorm/cache/QueryResultCache';
import { QueryResultCacheOptions } from 'typeorm/cache/QueryResultCacheOptions';

export interface GroupInvalidatableQueryCache extends QueryResultCache {
  invalidateGroup(group: string): Promise<void>;
}

/** Redis-backed TypeORM query-result cache. Redis errors always fall through to the database. */
export class RedisQueryResultCache implements GroupInvalidatableQueryCache {
  private readonly logger = new Logger(RedisQueryResultCache.name);
  private readonly client: ReturnType<typeof createClient>;
  private available = false;

  constructor(
    private readonly namespace: string,
    redisUrl: string,
  ) {
    this.client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 1_000,
        reconnectStrategy: (retries) => Math.min(retries * 500, 5_000),
      },
    });
    this.client.on('error', (error) => {
      this.available = false;
      this.logger.warn(`Redis cache (${this.namespace}) unavailable: ${error.message}`);
    });
    this.client.on('ready', () => { this.available = true; });
  }

  async connect(): Promise<void> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.client.connect(),
        new Promise<void>((resolve) => { timeout = setTimeout(resolve, 1_500); }),
      ]);
      this.available = this.client.isReady;
    } catch (error) {
      this.available = false;
      this.logger.warn(`Redis cache (${this.namespace}) could not connect; database reads will continue: ${this.errorMessage(error)}`);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client.isOpen) return;
    try {
      await this.client.quit();
    } catch (error) {
      this.logger.warn(`Redis cache (${this.namespace}) disconnect failed: ${this.errorMessage(error)}`);
    } finally {
      this.available = false;
    }
  }

  async synchronize(_queryRunner?: QueryRunner): Promise<void> {}

  async getFromCache(options: QueryResultCacheOptions, _queryRunner?: QueryRunner): Promise<QueryResultCacheOptions | undefined> {
    if (!this.isAvailable()) return undefined;
    try {
      const value = await this.client.get(this.cacheKey(options));
      if (!value) return undefined;
      const cached = JSON.parse(value) as QueryResultCacheOptions;
      return this.isExpired(cached) ? undefined : cached;
    } catch (error) {
      this.report(error, 'read');
      return undefined;
    }
  }

  isExpired(savedCache: QueryResultCacheOptions): boolean {
    return (savedCache.time ?? 0) + savedCache.duration < Date.now();
  }

  async storeInCache(options: QueryResultCacheOptions, _savedCache: QueryResultCacheOptions | undefined, _queryRunner?: QueryRunner): Promise<void> {
    if (!this.isAvailable()) return;
    const identifier = this.identifier(options);
    if (!identifier) return;

    try {
      const key = this.cacheKey(options);
      await this.client.set(key, JSON.stringify(options), { expiration: { type: 'PX', value: options.duration } });
      const group = this.groupFromIdentifier(identifier);
      if (group) {
        const indexKey = this.groupIndexKey(group);
        await this.client.sAdd(indexKey, key);
        await this.client.pExpire(indexKey, options.duration);
      }
    } catch (error) {
      this.report(error, 'write');
    }
  }

  async clear(_queryRunner?: QueryRunner): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      const keys: string[] = [];
      for await (const batch of this.client.scanIterator({ MATCH: `${this.namespace}:*`, COUNT: 100 })) {
        keys.push(...batch.map(String));
      }
      if (keys.length) await this.client.del(keys);
    } catch (error) {
      this.report(error, 'clear');
    }
  }

  async remove(identifiers: string[], _queryRunner?: QueryRunner): Promise<void> {
    if (!this.isAvailable() || identifiers.length === 0) return;
    try {
      await this.client.del(identifiers.map((identifier) => this.keyForIdentifier(identifier)));
    } catch (error) {
      this.report(error, 'invalidate');
    }
  }

  async invalidateGroup(group: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      const indexKey = this.groupIndexKey(group);
      const keys = await this.client.sMembers(indexKey);
      if (keys.length) await this.client.del(keys);
      await this.client.del(indexKey);
    } catch (error) {
      this.report(error, `invalidate group ${group}`);
    }
  }

  private cacheKey(options: QueryResultCacheOptions): string {
    const identifier = this.identifier(options);
    return identifier ? this.keyForIdentifier(identifier) : `${this.namespace}:query:${options.query ?? ''}`;
  }

  private identifier(options: QueryResultCacheOptions): string | undefined {
    return options.identifier || undefined;
  }

  private keyForIdentifier(identifier: string): string {
    return identifier.startsWith(`${this.namespace}:`) ? identifier : `${this.namespace}:${identifier}`;
  }

  private groupFromIdentifier(identifier: string): string | undefined {
    const parts = identifier.split(':');
    return parts[0] === this.namespace.split(':')[0] && parts[1] === this.namespace.split(':')[1]
      ? parts[2]
      : undefined;
  }

  private groupIndexKey(group: string): string {
    return `${this.namespace}:group:${group}`;
  }

  private isAvailable(): boolean {
    return this.available && this.client.isReady;
  }

  private report(error: unknown, operation: string): void {
    this.logger.warn(`Redis cache ${operation} failed (${this.namespace}); continuing with PostgreSQL: ${this.errorMessage(error)}`);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
