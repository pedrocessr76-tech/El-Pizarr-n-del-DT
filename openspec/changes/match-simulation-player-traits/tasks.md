# Tasks: Player Traits System for Match Simulation

## Phase 1: Database & Types (Foundation)

- [ ] **1.1** Create migration: `migrations/XXXX-add-player-traits.ts`
  - Add 22 columns to `players` table with DEFAULT 50
  - Add `traits_json` TEXT nullable column
  - Run migration on dev/staging

- [ ] **1.2** Update `PlayerEntity` (`apps/server/src/player/player.entity.ts`)
  - Add 22 `@Column` decorators with defaults
  - Add `traitsJson` column

- [ ] **1.3** Update shared `Player` interface (`packages/shared/types/models.ts`)
  - Add all 22 optional trait fields
  - Add `traitsJson?: string`

- [ ] **1.4** Update `toPlayer()` in `MatchService` (`apps/server/src/match/match.service.ts`)
  - Map 22 new entity fields to Player interface

## Phase 2: Core Simulation Engine

- [ ] **2.1** Add `PlayerTraits` type and `getTraits()` helper (`match-simulation.ts`)
  - Default all to 50 if undefined

- [ ] **2.2** Add `incidentSeed()` deterministic function
  - Input: matchId, minute, playerId, incidentType
  - Output: 0..1 reproducible float

- [ ] **2.3** Implement incident probability calculators
  - `calculateRedCardProbability(traits, minute, context)`
  - `calculateInjuryProbability(traits, minute, context)`
  - `calculateWonderGoalProbability(traits, minute)`
  - `calculatePenaltyProbability(attacker, defender, minute, inBox)`
  - `calculateOwnGoalProbability(defender, minute, context)`
  - `calculateGKEventProbability(gk, shotQuality, minute)`

- [ ] **2.4** Implement `generateIncidents(matchId, home, away, context)`
  - Loop minutes 1..90, each starter
  - Check each incident type using seed
  - Return sorted `MatchIncident[]`

- [ ] **2.5** Define incident types and interfaces
  - `IncidentType` union
  - `MatchIncident`, `TacticalImpact`, `FormationProfile`, `TimelineEvent`
  - Update `MatchSimulationResult` to include `incidents[]`, `timeline[]`, `finalFormation`

- [ ] **2.6** Implement `applyIncidentsToSimulation(incidents, homeLambda, awayLambda, homeTeam, awayTeam)`
  - Track formation per team
  - Apply xG modifiers chronologically
  - Handle player removals (red/injury) with substitute logic
  - Return adjusted lambdas + modified teams

- [ ] **2.7** Modify `simulateMatch()` signature and logic
  - Add `context: MatchContext` parameter
  - Call `generateIncidents()` at start
  - Call `applyIncidentsToSimulation()` before Poisson
  - Use adjusted teams/lambdas for goals, penalties, summary
  - Build timeline from incidents + goals
  - Return enriched result

## Phase 3: Context & Integration

- [ ] **3.1** Define `MatchContext` interface
  ```typescript
  interface MatchContext {
    round: RoundName;
    isHomeUserTeam: boolean;
    isAwayUserTeam: boolean;
    homeForm: number;      // 0.9-1.1 multiplier
    awayForm: number;
    highIntensity: boolean;
  }
  ```

- [ ] **3.2** Update `MatchService.simulateAndPersistMatch()`
  - Build context from tournament, round, recent form
  - Pass context to `matchSimulation.simulateMatch()`
  - Persist `incidentsJson` and `timelineJson` on `MatchEntity`

- [ ] **3.3** Add `incidentsJson` and `timelineJson` to `MatchEntity`
  - `@Column({ type: 'text', nullable: true }) incidentsJson`
  - `@Column({ type: 'text', nullable: true }) timelineJson`

- [ ] **3.4** Update `MatchService.getTournament()` to include incidents/timeline
  - Parse JSON when hydrating matches

- [ ] **3.5** Update `matchService.ts` (client) types
  - `SimulateMatchResponse` includes `incidents`, `timeline`
  - `HistoryMatchItem` includes `incidents`, `timeline`

## Phase 4: Backfill & Data

- [ ] **4.1** Create backfill script `scripts/backfill-player-traits.ts`
  - Infer traits from position, stats, nationality, rating
  - Position defaults (DEF: high aggression/aerial, MID: vision, FWD: flair, GK: GK traits)
  - Stat mappings (defending→aggression, passing→vision, dribbling→flair/skillMoves, etc.)
  - Nationality boosts (Argentina/Brasil/Uruguay/Chile/Colombia: +10 aggression, +15 flair, +10 bigGamePlayer)
  - Rating tier: >85 OVR gets +consistency, +composure

- [ ] **4.2** Run backfill on dev database
  - Verify 100% players have plausible traits
  - Spot-check known players (Rojo, Messi, Ramos)

- [ ] **4.3** Create JSON import template for new players
  - Document in external markdown (see player-traits-json-template.md)

## Phase 5: Frontend Integration

- [ ] **5.1** Update `LiveMatchOverlay.tsx`
  - Consume `match.incidents` and `match.timeline` props
  - Render incident icons with trait-aware emojis
  - Show formation change animations
  - Display momentum indicators (🔥/💥)

- [ ] **5.2** Add incident icon helper
  ```typescript
  function getIncidentIcon(incident, playerTraits) {
    // Returns 🟥😤 for high-aggression red, 🌟✨ for high-flair wonder goal, etc.
  }
  ```

- [ ] **5.3** Update `TournamentBracketPage` to pass incidents/timeline to overlay

## Phase 6: Testing

- [ ] **6.1** Unit tests for probability calculators
  - Red card: aggression=90, discipline=20 → prob ≈ 0.0075 (5x base)
  - Injury: injuryProneness=80 → prob ≈ 0.009 (3x base)
  - Wonder goal: flair=99, skillMoves=99 → prob > 0
  - Wonder goal: flair=50 → prob = 0
  - Penalty: penaltyTaking=90 → conversion > 85%
  - Deterministic seed: same inputs = same output

- [ ] **6.2** Unit tests for `applyIncidentsToSimulation`
  - Red card at min 30 → xG × 0.75 for 60 min, formation change
  - Injury at min 60 → sub enters, xG × 0.85 for 10 min
  - Multiple incidents stack correctly

- [ ] **6.3** Integration test: full simulateMatch with incidents
  - Verify incidents persisted to DB
  - Verify timeline generated
  - Verify result deterministic for same matchId

- [ ] **6.4** Regression tests
  - All existing match-simulation tests pass
  - Tournament creation/advancement works
  - History shows incidents

## Phase 7: Documentation & Polish

- [ ] **7.1** Update API docs (Swagger) for new response fields
- [ ] **7.2** Add JSDoc to all new public functions
- [ ] **7.3** Verify no TypeScript errors
- [ ] **7.4** Run lint and typecheck

## Dependencies & Order

```
1.1 → 1.2 → 1.3 → 1.4
                    ↓
2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7
                    ↓
3.1 → 3.2 → 3.3 → 3.4 → 3.5
                    ↓
4.1 → 4.2 → 4.3
                    ↓
5.1 → 5.2 → 5.3
                    ↓
6.1 → 6.2 → 6.3 → 6.4
                    ↓
7.1 → 7.2 → 7.3 → 7.4
```

## Estimated Effort

| Phase | Tasks | Est. Days |
|-------|-------|-----------|
| 1: DB & Types | 4 | 1 |
| 2: Core Engine | 7 | 3 |
| 3: Integration | 5 | 1 |
| 4: Backfill | 3 | 1 |
| 5: Frontend | 3 | 1 |
| 6: Testing | 4 | 2 |
| 7: Polish | 4 | 0.5 |
| **Total** | **30** | **~9.5** |