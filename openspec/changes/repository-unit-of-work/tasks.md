## 1. Inventory and architecture

- [x] 1.1 Inventory all persistence access in `apps/server` (injected repositories, `DataSource`, `EntityManager`, QueryRunner, raw SQL, lifecycle hooks, jobs) and map it to the game or B2B datasource.
- [x] 1.2 Define repository contracts and Nest injection tokens for each persistence area; keep TypeORM repository/query-builder types inside infrastructure.
- [x] 1.3 Define the Unit of Work API and separate game/B2B implementations that construct transaction-scoped repositories from the callback `EntityManager`.
- [x] 1.4 Register repository adapters and Unit of Work providers in the correct feature and datasource modules.

## 2. Core infrastructure and verification

- [x] 2.1 Implement the TypeORM repository adapters and transaction-scoped repository factory for the game datasource.
- [x] 2.2 Implement the TypeORM repository adapters and transaction-scoped repository factory for the B2B datasource.
- [x] 2.3 Add tests proving successful commit, rollback on thrown errors, and atomic writes across multiple repositories.
- [x] 2.4 Add tests proving datasource isolation so game and B2B repositories cannot be obtained from the other Unit of Work.

## 3. Migrate game persistence

- [x] 3.1 Migrate user, auth, player/catalog, team and draft services to repository contracts; update module bindings and unit fixtures.
- [x] 3.2 Migrate tournament/match services and multi-write tournament creation/advancement flows to the game Unit of Work.
- [x] 3.3 Migrate seed, catalog synchronization, initialization hooks and other game persistence entry points.
- [x] 3.4 Confirm no game application service imports TypeORM repositories, EntityManager or QueryBuilder directly.

## 4. Migrate B2B persistence

- [x] 4.1 Migrate B2B authentication, user and organization/facility/court/shift/booking services to repository contracts.
- [x] 4.2 Migrate B2B notifications, messaging workflows, schedulers and other background/lifecycle persistence entry points.
- [x] 4.3 Wrap B2B multi-write onboarding and booking workflows with the B2B Unit of Work and preserve existing transaction boundaries.
- [x] 4.4 Confirm no B2B application service imports TypeORM repositories, EntityManager or QueryBuilder directly.

## 5. Complete migration

- [x] 5.1 Review the persistence inventory and migrate remaining server runtime access paths; CLI datasource setup and migrations remain infrastructure.
- [x] 5.2 Remove obsolete direct TypeORM injection/provider paths and keep repository implementations in infrastructure.
- [ ] 5.3 Run server build, relevant unit/integration tests, migration checks and existing game/B2B smoke flows; resolve regressions.
- [x] 5.4 No API/database migration was introduced; game/B2B boundaries remain separate and no cross-datasource atomic flow exists.
