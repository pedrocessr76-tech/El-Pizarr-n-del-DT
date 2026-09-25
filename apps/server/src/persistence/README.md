# Result cache

The server uses TypeORM's query-result cache contract with Redis. This caches opted-in query results; it is not automatic entity-level caching. PostgreSQL remains the source of truth.

## Configuration

Set `RESULT_CACHE_REDIS_URL` (or `REDIS_URL`) and enable each datasource independently:

- `DB_CACHE_ENABLED=true` for the game database.
- `B2B_DB_CACHE_ENABLED=true` for the B2B database.
- `DB_CACHE_TTL_MS` and `B2B_DB_CACHE_TTL_MS` set finite per-datasource TTLs. The default is 60 seconds.

Both datasources may share one Redis URL. Their keys use separate `pizarron:game` and `pizarron:b2b` namespaces. Local Docker Compose includes Redis at `redis://redis-cache:6379`; `.env.example` keeps both caches disabled by default. Production can provide a Redis-compatible URL through the server environment and enable either area independently.

If Redis is missing or unavailable, the cache disables/falls through and PostgreSQL continues serving reads. No cache table or business-schema migration is required. Disable either cache flag to roll back.

## Adding a cacheable read

Keep reads uncached by default. Opt a read in only when its data is safe to serve for the configured TTL; include every filter, order and pagination value in its cache identity. Assign a stable invalidation group, and ensure every successful write affecting that result invalidates the group after commit. Unit of Work repositories must bypass cache for reads and defer write invalidation until the transaction commits. Do not cache authentication, authorization, session, booking, availability, or other transactional reads.

The player catalog is the initial cacheable group (`player-catalog`). Player repository writes invalidate this group. Cache invalidation failures are logged; finite TTL bounds any stale result.
