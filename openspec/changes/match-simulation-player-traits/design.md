# Design: Player Traits System for Match Simulation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      MatchSimulation                            │
├─────────────────────────────────────────────────────────────────┤
│  simulateMatch(home, away, context)                             │
│    │                                                            │
│    ├─▶ getTraits(player) → PlayerTraits (22 fields, defaults)  │
│    │                                                            │
│    ├─▶ generateIncidents(matchId, home, away, context)         │
│    │     │                                                      │
│    │     ├─▶ For minute 1..90, each starter:                   │
│    │     │     ├─▶ seed = incidentSeed(matchId, minute, pid)  │
│    │     │     ├─▶ checkRedCard(traits, minute, context, seed)│
│    │     │     ├─▶ checkInjury(traits, minute, context, seed)  │
│    │     │     ├─▶ checkWonderGoal(traits, minute, seed)       │
│    │     │     ├─▶ checkPenalty(attacker, defender, seed)      │
│    │     │     ├─▶ checkOwnGoal(defender, minute, context)     │
│    │     │     └─▶ checkGKEvents(gk, shotQuality, minute)      │
│    │     │                                                      │
│    │     └─▶ Returns MatchIncident[] (sorted by minute)        │
│    │                                                            │
│    ├─▶ applyIncidentsToSimulation(incidents, homeLambda,       │
│    │     awayLambda, homeTeam, awayTeam)                       │
│    │     │                                                      │
│    │     ├─▶ Clone teams, track formation per team             │
│    │     ├─▶ For each incident in chronological order:         │
│    │     │     ├─▶ Apply xG modifier for duration              │
│    │     │     ├─▶ Apply formation change (red/injury)         │
│    │     │     └─▶ Track player removal (red/injury)           │
│    │     │                                                      │
│    │     └─▶ Returns adjusted lambdas + modified teams         │
│    │                                                            │
│    ├─▶ Run Poisson with adjusted lambdas → scores             │
│    ├─▶ Resolve penalties if draw (uses penaltyTaking/composure)│
│    ├─▶ computeMatchSummary with incident-adjusted ratings     │
│    │                                                            │
│    └─▶ Return MatchSimulationResult {                          │
│          homeScore, awayScore, winnerId, summary,              │
│          incidents, timeline, finalFormation                   │
│        }                                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model Changes

### 1. PlayerEntity (apps/server/src/player/player.entity.ts)

```typescript
@Entity('players')
export class PlayerEntity {
  // ... existing fields ...

  // Personality Traits (1-99)
  @Column({ type: 'int', default: 50 }) aggression: number;
  @Column({ type: 'int', default: 50 }) discipline: number;
  @Column({ type: 'int', default: 50 }) composure: number;
  @Column({ type: 'int', default: 50 }) leadership: number;
  @Column({ type: 'int', default: 50 }) consistency: number;
  @Column({ type: 'int', default: 50 }) bigGamePlayer: number;
  @Column({ type: 'int', default: 50 }) injuryProneness: number;
  @Column({ type: 'int', default: 50 }) durability: number;

  // Technical Traits (1-99)
  @Column({ type: 'int', default: 50 }) flair: number;
  @Column({ type: 'int', default: 50 }) vision: number;
  @Column({ type: 'int', default: 50 }) penaltyTaking: number;
  @Column({ type: 'int', default: 50 }) freeKickAccuracy: number;
  @Column({ type: 'int', default: 50 }) aerialAbility: number;
  @Column({ type: 'int', default: 50 }) weakFoot: number;
  @Column({ type: 'int', default: 50 }) skillMoves: number;

  // GK Traits (1-99, only meaningful for GK)
  @Column({ type: 'int', default: 50 }) gkReflexes: number;
  @Column({ type: 'int', default: 50 }) gkHandling: number;
  @Column({ type: 'int', default: 50 }) gkAerialOut: number;
  @Column({ type: 'int', default: 50 }) gkCommunication: number;
  @Column({ type: 'int', default: 50 }) gkOneOnOnes: number;

  // Extensible
  @Column({ type: 'text', nullable: true }) traitsJson: string | null;
}
```

### 2. Shared Types (packages/shared/types/models.ts)

```typescript
export interface Player {
  // ... existing ...
  
  // Personality
  aggression?: number;
  discipline?: number;
  composure?: number;
  leadership?: number;
  consistency?: number;
  bigGamePlayer?: number;
  injuryProneness?: number;
  durability?: number;
  
  // Technical
  flair?: number;
  vision?: number;
  penaltyTaking?: number;
  freeKickAccuracy?: number;
  aerialAbility?: number;
  weakFoot?: number;
  skillMoves?: number;
  
  // GK
  gkReflexes?: number;
  gkHandling?: number;
  gkAerialOut?: number;
  gkCommunication?: number;
  gkOneOnOnes?: number;
  
  traitsJson?: string;
}
```

### 3. New Types (apps/server/src/match/match-simulation.ts)

```typescript
export interface PlayerTraits {
  aggression: number;
  discipline: number;
  composure: number;
  leadership: number;
  consistency: number;
  bigGamePlayer: number;
  injuryProneness: number;
  durability: number;
  flair: number;
  vision: number;
  penaltyTaking: number;
  freeKickAccuracy: number;
  aerialAbility: number;
  weakFoot: number;
  skillMoves: number;
  gkReflexes: number;
  gkHandling: number;
  gkAerialOut: number;
  gkCommunication: number;
  gkOneOnOnes: number;
}

export type IncidentType = 
  | 'RED_CARD' | 'INJURY' | 'PENALTY' | 'WONDER_GOAL' 
  | 'OWN_GOAL' | 'GK_HEROICS' | 'GK_HOWLER' 
  | 'GOAL_DISALLOWED' | 'PENALTY_CANCELLED' 
  | 'MOMENTUM_SHIFT' | 'FREE_KICK_GOAL' | 'HEADER_GOAL';

export interface MatchIncident {
  minute: number;
  type: IncidentType;
  team: 'home' | 'away';
  playerId: string;
  playerName: string;
  description: string;
  tacticalImpact: TacticalImpact;
  isVAR?: boolean;
  affectsNextMatch?: boolean; // red card = 1 match ban, injury = recovery
}

export interface TacticalImpact {
  formationChange?: FormationProfile;
  xGModifier: number;        // e.g., -0.25 for red card
  durationMinutes: number;   // 0 = rest of match
}

export interface FormationProfile {
  def: number;  // defenders on pitch
  mid: number;  // midfielders on pitch
  att: number;  // attackers on pitch
}

export interface TimelineEvent {
  minute: number;
  type: 'incident' | 'goal' | 'substitution' | 'formation_change' | 'momentum';
  team: 'home' | 'away';
  description: string;
  incidentId?: number;
  playerId?: string;
}

export interface MatchSimulationResult {
  homeScore: number;
  awayScore: number;
  winnerId: string;
  summary: MatchSummary;
  incidents: MatchIncident[];
  timeline: TimelineEvent[];
  finalFormation: { home: FormationProfile; away: FormationProfile };
}
```

## Incident Probability Formulas

### Base Rates (per minute per player)
```typescript
const BASE_RATES = {
  RED_CARD: 0.0015,      // ~1.3% per match per player
  INJURY: 0.003,         // ~2.5% per match per player
  WONDER_GOAL: 0.0005,   // ~0.4% per match (elite only)
  PENALTY_ATTACK: 0.0008, // per attacker vs defender in box
  OWN_GOAL: 0.0004,      // per defender under pressure
  GK_HEROICS: 0.002,     // per shot on target
  GK_HOWLER: 0.001,      // per shot on target
};
```

### Trait Modifiers
```typescript
// Red Card: aggression ↑, discipline ↓, defending ↓, losing ↑, late ↑
redCardProb = base * (1 + aggression/50) * (2 - discipline/50) 
              * (defending < 60 ? 1.3 : 1) 
              * (isLosing ? 1.5 : isDrawing ? 1.0 : 0.7)
              * (minute > 75 ? 1.8 : minute > 60 ? 1.3 : 1.0)
              * (position === 'DEF' ? 1.3 : position === 'MID' ? 1.0 : 0.5);

// Injury: injuryProneness ↑, durability ↓, physical ↓, intensity ↑, late ↑
injuryProb = base * (1 + injuryProneness/40) * (2 - durability/50)
             * (100 - physical)/100 * 0.8
             * (highIntensity ? 1.5 : 1.0)
             * (minute > 80 ? 2.0 : minute > 60 ? 1.4 : 1.0);

// Wonder Goal: flair ↑, dribbling ↑, shooting ↑, skillMoves ↑, space ↑
wonderGoalProb = base * (flair/50) * (skillMoves/50) 
                 * ((dribbling + shooting)/200)
                 * (minute > 70 ? 1.3 : 1.0);
if (!isWonderGoalCandidate) return 0; // flair>80, shooting>75, pace>78

// Penalty: attacker dribbling/pace vs defender discipline/defending
penaltyProb = base * (attacker.dribbling + attacker.pace)/200
              * (2 - defender.discipline/50)
              * (2 - defender.defending/100);

// Own Goal: composure ↓, passing ↓, aerialAbility ↓, pressure ↑, setPiece ↑
ownGoalProb = base * (2 - composure/50) * (2 - passing/50)
              * (isSetPiece ? 3.0 : 1.0)
              * (isLosing ? 1.8 : isDrawing ? 1.2 : 0.8);

// GK Heroics: reflexes ↑, oneOnOnes ↑, composure ↑
gkHeroicsProb = base * (gkReflexes + gkOneOnOnes)/100 * (composure/50);

// GK Howler: handling ↓, composure ↓, communication ↓, fatigue ↑
gkHowlerProb = base * (2 - gkHandling/50) * (2 - composure/50)
               * (2 - gkCommunication/50)
               * (minute > 80 ? 1.3 : 1.0);
```

## Deterministic Seeding

```typescript
function incidentSeed(matchId: string, minute: number, playerId: string, type: string): number {
  const str = `${matchId}|${minute}|${playerId}|${type}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) / 2147483647; // 0..1 deterministic
}

function checkRedCard(player, traits, minute, context, seed): boolean {
  const prob = calculateRedCardProbability(traits, minute, context);
  return seed < prob;
}
```

## Tactical Consequences

### Red Card
- Player removed for rest of match
- Formation adapts: `adaptFormationAfterRed(formation, lostPosition)`
- Team xG × 0.75 for remainder
- `affectsNextMatch: true` (1-match ban)

### Injury
- Player removed, substitute enters (rating -20 vs starter)
- If no sub for position: player plays "injured" (stats × 0.7)
- xG × 0.85 for 10 min, then × 0.95
- `affectsNextMatch: true` (recovery 1-3 matches)

### Momentum Shift
- Triggered by 2+ goals in 10 min (for/against)
- Positive: team xG × (1 + intensity × 0.08) for 15 min
- Negative: team xG × (1 - intensity × 0.06) for 15 min
- Leadership reduces negative momentum: × (1 - leadership/200)

## Integration Points

### MatchService.simulateAndPersistMatch()
```typescript
// Before: result = matchSimulation.simulateMatch(home, away)
// After:
const context = {
  round: matchEntity.round,
  isHomeUserTeam: homeTeamId === tournament.userTeamId,
  isAwayUserTeam: awayTeamId === tournament.userTeamId,
  homeForm: await getRecentForm(homeTeamId, tournamentId),
  awayForm: await getRecentForm(awayTeamId, tournamentId),
  highIntensity: ['SEMIS', 'FINAL'].includes(matchEntity.round),
};
const result = matchSimulation.simulateMatch(homeTeam, awayTeam, context);

// Persist incidents + timeline
matchEntity.incidentsJson = JSON.stringify(result.incidents);
matchEntity.timelineJson = JSON.stringify(result.timeline);
```

### LiveMatchOverlay Consumption
```typescript
// Receives match.incidents and match.timeline from API
// Renders incident icons with player trait context:
// - 🟥😤 for high-aggression red cards
// - 🌟✨ for high-flair wonder goals
// - 🧤🛑 for GK heroics
// Shows formation change animations when incidents occur
```

## Migration Strategy

### SQL Migration
```sql
ALTER TABLE players 
ADD COLUMN aggression INTEGER DEFAULT 50,
ADD COLUMN discipline INTEGER DEFAULT 50,
-- ... all 22 columns ...
ADD COLUMN traits_json TEXT;
```

### Backfill Script (scripts/backfill-player-traits.ts)
```typescript
// For each existing player, infer traits from:
// 1. Position-based defaults
// 2. Stats-based calculations (defending→aggression, passing→vision, etc.)
// 3. Nationality boosts (Latin American: +aggression, +flair, +bigGamePlayer)
// 4. Rating tier adjustments (elite players: +consistency, +composure)
```

## Testing Requirements

### Unit Tests (match-simulation.spec.ts)
- [ ] Red card probability: high aggression + low discipline = 5x base
- [ ] Injury probability: high injuryProneness = 3x base
- [ ] Wonder goal: only players with flair>80, shooting>75, pace>78 can trigger
- [ ] Penalty shootout: penaltyTaking > 80 increases conversion to >85%
- [ ] GK heroics: high reflexes + oneOnOnes increases save rate
- [ ] Deterministic seeding: same matchId produces identical incidents
- [ ] Tactical impact: red card reduces xG by 25%, changes formation
- [ ] Momentum: 2 quick goals triggers 15-min boost

### Integration Tests
- [ ] Full simulateMatch with incidents persists to DB
- [ ] LiveMatchOverlay receives and renders incidents correctly
- [ ] Tournament advancement works with incident-affected results