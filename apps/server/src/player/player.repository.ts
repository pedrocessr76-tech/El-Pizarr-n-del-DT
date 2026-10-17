import { PlayerEntity } from './player.entity';

export interface PlayerFilters {
  name?: string;
  position?: string;
  rarity?: 'gold' | 'silver' | 'bronze';
  minRating?: number | string;
  maxRating?: number | string;
  /** Página solicitada (1-based). Default: 1 */
  page?: number | string;
  /** Jugadores por página. Default: 48, max: 100 */
  limit?: number | string;
}

export interface PaginatedPlayers {
  data: PlayerEntity[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PlayerCatalogRepository {
  findCatalog(filters?: PlayerFilters): Promise<PaginatedPlayers>;
  countByPosition(): Promise<Array<{ position: string; count: number }>>;
}

export const PLAYER_CATALOG_REPOSITORY = Symbol('PLAYER_CATALOG_REPOSITORY');

