# Proposal: Player Traits System for Match Simulation

## Summary
Add a comprehensive **Player Traits System** to the match simulation engine that uses individual player characteristics (personality, technical specialties, goalkeeper skills) to drive dynamic match incidents (red cards, injuries, wonder goals, penalties, own goals, GK heroics/howlers, momentum shifts, VAR). This replaces the current purely rating-based Poisson simulation with a rich, narrative-driven system where specific players behave true to their real-life profiles.

## Problem
- Current simulation uses only average team rating → all teams with same rating play identically
- No player personality: Marcos Rojo and Sergio Ramos have same "defender" behavior
- No dramatic incidents: red cards, injuries, wonder goals, VAR don't exist
- No tactical consequences: incidents don't change formation or xG dynamically
- LiveMatchOverlay shows generic events, not player-specific narratives

## Solution
Add **22 new trait columns** to `PlayerEntity` (personality + technical + GK traits) + extensible `traitsJson`. Use these traits in `MatchSimulation` to:
1. **Pre-generate incidents deterministically** per match (seeded by matchId + minute + playerId)
2. **Calculate incident probabilities** per player per minute using trait-weighted formulas
3. **Apply tactical consequences** (formation changes, xG modifiers, next-match suspensions)
4. **Expose rich timeline** to `LiveMatchOverlay` for narrative visualization

## Scope
### In Scope
- 22 new DB columns on `players` table + migration
- Extended `Player` interface in `packages/shared/types/models.ts`
- New `MatchIncident` types and `generateIncidents()` in `MatchSimulation`
- Modified `simulateMatch()` to consume incidents and adjust xG/formations
- Updated `MatchSimulationResult` with `incidents[]` and `timeline[]`
- Backfill script for existing players (infer traits from stats + position + nationality)
- JSON import format for new players

### Out of Scope
- Player trait editing UI (future: TeamBuilderPage trait editor)
- Persistent injury/suspension across tournament matches (v2)
- Manager/coach traits affecting tactics
- Weather/pitch conditions

## Success Criteria
- [ ] Migration runs without data loss
- [ ] Backfill assigns plausible traits to 100% existing players
- [ ] Simulation produces ≥3 distinct incident types per match on average
- [ ] Marcos Rojo (aggression=92, discipline=28) gets red cards ~5x more than avg defender
- [ ] Messi (flair=99, composure=98) produces wonder goals, never red cards
- [ ] LiveMatchOverlay shows incident icons with player-specific context
- [ ] All existing tests pass + new incident tests added