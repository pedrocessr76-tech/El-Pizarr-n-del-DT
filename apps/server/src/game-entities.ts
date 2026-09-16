import { MatchEntity } from './match/entities/match.entity';
import { TournamentEntity } from './match/entities/tournament.entity';
import { PlayerEntity } from './player/player.entity';
import { TeamPlayerEntity } from './team/team-player.entity';
import { TeamEntity } from './team/team.entity';
import { UserEntity } from './user/user.entity';

/**
 * Entidades de la base del juego.
 *
 * Se declaran de forma explícita —igual que `B2B_ENTITIES`— en lugar de usar un
 * glob `**\/*.entity{.ts,.js}` con un patrón negado `!.../b2b/**`:
 * TypeORM reduce cada patrón con `globSync`, que **ignora** los patrones que
 * empiezan con `!`. El resultado era que la conexión del juego registraba
 * también las entidades B2B y `synchronize` creaba las 11 tablas `b2b_*`
 * dentro de la base `pizarron_dt`.
 *
 * Si se agrega una entidad nueva al juego hay que sumarla acá.
 */
export const GAME_ENTITIES = [
  PlayerEntity,
  TeamEntity,
  TeamPlayerEntity,
  UserEntity,
  MatchEntity,
  TournamentEntity,
];
