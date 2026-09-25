import { DataSource, DataSourceOptions } from 'typeorm';
import { RedisQueryResultCache } from './redis-query-result-cache';

export type CacheArea = 'game' | 'b2b';

export interface ResultCacheSettings {
  enabled: boolean;
  namespace: string;
  ttlMs: number;
  redisUrl?: string;
}

const warnedMissingRedisUrl = new Set<CacheArea>();

export function getResultCacheSettings(area: CacheArea): ResultCacheSettings {
  const prefix = area === 'game' ? 'DB' : 'B2B_DB';
  const enabledValue = process.env[`${prefix}_CACHE_ENABLED`] ?? process.env.RESULT_CACHE_ENABLED;
  const redisUrl = process.env.RESULT_CACHE_REDIS_URL || process.env.REDIS_URL;
  const enabled = enabledValue === 'true' && Boolean(redisUrl);
  if (enabledValue === 'true' && !redisUrl && !warnedMissingRedisUrl.has(area)) {
    warnedMissingRedisUrl.add(area);
    console.warn(`Result cache (${area}) was requested but RESULT_CACHE_REDIS_URL/REDIS_URL is missing; caching is disabled.`);
  }
  const configuredTtl = Number(process.env[`${prefix}_CACHE_TTL_MS`] || process.env.RESULT_CACHE_TTL_MS || 60_000);
  const ttlMs = Number.isFinite(configuredTtl) && configuredTtl > 0 ? Math.floor(configuredTtl) : 60_000;

  return {
    enabled,
    namespace: `pizarron:${area}`,
    ttlMs,
    redisUrl,
  };
}

export function getResultCacheOptions(area: CacheArea): DataSourceOptions['cache'] {
  const settings = getResultCacheSettings(area);
  if (!settings.enabled || !settings.redisUrl) return false;

  return {
    provider: (_dataSource: DataSource) =>
      new RedisQueryResultCache(settings.namespace, settings.redisUrl!),
    duration: settings.ttlMs,
    ignoreErrors: true,
  };
}
