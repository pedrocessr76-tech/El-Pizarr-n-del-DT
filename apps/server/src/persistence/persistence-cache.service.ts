import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { DataSource } from 'typeorm';
import { CacheArea, getResultCacheSettings } from './result-cache.config';
import { GroupInvalidatableQueryCache } from './redis-query-result-cache';

export interface PersistenceCache {
  isEnabled(area: CacheArea): boolean;
  ttlMs(area: CacheArea): number;
  cacheId(area: CacheArea, group: string, criteria: unknown): string;
  invalidate(area: CacheArea, group: string): Promise<void>;
}

export const PERSISTENCE_CACHE = Symbol('PERSISTENCE_CACHE');

@Injectable()
export class PersistenceCacheService implements PersistenceCache {
  private readonly logger = new Logger(PersistenceCacheService.name);

  constructor(private readonly dataSources: Partial<Record<CacheArea, DataSource>>) {}

  isEnabled(area: CacheArea): boolean {
    return getResultCacheSettings(area).enabled;
  }

  ttlMs(area: CacheArea): number {
    return getResultCacheSettings(area).ttlMs;
  }

  cacheId(area: CacheArea, group: string, criteria: unknown): string {
    const settings = getResultCacheSettings(area);
    const digest = createHash('sha256').update(this.stableStringify(criteria)).digest('hex');
    return `${settings.namespace}:${group}:${digest}`;
  }

  async invalidate(area: CacheArea, group: string): Promise<void> {
    if (!this.isEnabled(area)) return;
    const cache = this.dataSources[area]?.queryResultCache as GroupInvalidatableQueryCache | undefined;
    if (!cache || typeof cache.invalidateGroup !== 'function') {
      this.logger.warn(`Result cache invalidation unavailable for ${area}/${group}; entries will expire by TTL.`);
      return;
    }
    try {
      await cache.invalidateGroup(group);
    } catch (error) {
      this.logger.warn(`Result cache invalidation failed for ${area}/${group}; entries will expire by TTL: ${this.errorMessage(error)}`);
    }
  }

  private stableStringify(value: unknown): string {
    const normalize = (entry: unknown): unknown => {
      if (entry instanceof Date) return entry.toISOString();
      if (Array.isArray(entry)) return entry.map(normalize);
      if (entry && typeof entry === 'object') {
        const record = entry as Record<string, unknown>;
        const stringKeys = Object.keys(record).sort();
        const normalized: Record<string, unknown> = {};
        for (const key of stringKeys) normalized[key] = normalize(record[key]);
        for (const key of Object.getOwnPropertySymbols(record)) {
          normalized[`$${key.description ?? 'symbol'}`] = normalize((record as any)[key]);
        }
        return normalized;
      }
      return entry;
    };
    return JSON.stringify(normalize(value)) ?? 'undefined';
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
