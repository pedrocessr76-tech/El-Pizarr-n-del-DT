## 1. Cache backend and datasource configuration

- [x] 1.1 Add the compatible Redis client dependency and optional environment configuration for cache enablement, URL, and finite default TTL.
- [x] 1.2 Configure TypeORM query-result cache independently for game and B2B runtime and CLI datasources, with stable, isolated namespaces and no silent database-table cache fallback.
- [x] 1.3 Add cache connection diagnostics and fail-open behavior so an unavailable cache does not prevent application startup or database reads.

## 2. Repository cache and invalidation

- [x] 2.1 Define infrastructure-level cache options, deterministic normalized keys, and datasource/group namespaces without exposing TypeORM cache types to application services.
- [x] 2.2 Implement cacheable repository reads with finite TTL and tracking of query variants by invalidation group.
- [x] 2.3 Bypass cache for repositories created inside Unit of Work transactions and keep repository reads uncached unless explicitly opted in.
- [x] 2.4 Invalidate affected cache groups only after successful direct writes or after Unit of Work commit; record invalidation failures while relying on TTL as the staleness bound.

## 3. Opt in stable read paths

- [x] 3.1 Enable result caching for player catalog queries with normalized filter keys and an explicit TTL.
- [x] 3.2 Connect player/catalog writes and synchronization flows to invalidate the player catalog cache after successful persistence.
- [x] 3.3 Document the rule for adding further cacheable read groups and keep authentication, authorization, booking, availability, and transactional reads uncached.

## 4. Verification and operations

- [x] 4.1 Add tests for cache hit/miss, distinct query criteria, TTL expiry, and cache-backend read fallback.
- [x] 4.2 Add tests for post-commit invalidation, rollback preservation, invalidation failure, and isolation between game and B2B namespaces.
- [ ] 4.3 Verify both datasource configurations, server build, migration CLI configuration, and existing game/B2B smoke flows with cache disabled and enabled.
- [x] 4.4 Document local and production Redis configuration, activation/disablement, key namespaces, TTL, and rollback procedure.
