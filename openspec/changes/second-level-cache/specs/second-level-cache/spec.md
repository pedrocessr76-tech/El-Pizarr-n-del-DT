## ADDED Requirements

### Requirement: Cache selected repository reads
The server SHALL cache only explicitly opted-in repository read results using a finite TTL, with cache keys that distinguish the datasource and all result-affecting query criteria.

#### Scenario: Repeated cacheable read
- **WHEN** an opted-in read is repeated with the same datasource and normalized criteria before its TTL expires
- **THEN** the server returns the cached result without repeating the database query

#### Scenario: Different read criteria
- **WHEN** a cacheable read uses different filters, ordering, or pagination from an existing cached read
- **THEN** the server uses a distinct cache entry and returns results matching the new criteria

#### Scenario: Non-cacheable read
- **WHEN** a repository read has not been explicitly opted into caching
- **THEN** the server queries the datasource without using a cached result

### Requirement: Keep datasource caches isolated
The server SHALL keep game and B2B cache entries isolated, including when both datasources use the same Redis service.

#### Scenario: Same logical key in both datasources
- **WHEN** game and B2B store cache entries for the same logical key
- **THEN** reads and invalidations in either datasource affect only that datasource's entries

#### Scenario: Cache disabled for a datasource
- **WHEN** caching is disabled or unconfigured for one datasource
- **THEN** reads for that datasource use its database and do not affect the other datasource's cache

### Requirement: Invalidate cached reads after successful writes
The server SHALL invalidate cached read groups affected by a successful write only after that write or its Unit of Work transaction commits, and SHALL assign every entry a finite TTL.

#### Scenario: Successful write invalidates affected reads
- **WHEN** a write affecting a cacheable read group commits successfully
- **THEN** subsequent reads in that group query the database and return committed data

#### Scenario: Failed write preserves committed cache
- **WHEN** a write fails or a Unit of Work transaction rolls back
- **THEN** the server does not invalidate cache entries as if the write had committed

#### Scenario: Invalidation backend fails
- **WHEN** cache invalidation fails after a successful database commit
- **THEN** the database write remains successful, the failure is observable, and any stale entry expires within its configured TTL

### Requirement: Preserve transaction and database behavior during cache outages
The server SHALL bypass result caching for reads performed within a Unit of Work transaction and SHALL fall back to the datasource when the cache backend is unavailable.

#### Scenario: Transactional read
- **WHEN** application code reads through a repository scoped to an active Unit of Work
- **THEN** the read observes the transaction's database state and does not return a cached result

#### Scenario: Cache read failure
- **WHEN** the cache backend fails while serving an opted-in read
- **THEN** the server executes the read against the correct datasource and returns its result
