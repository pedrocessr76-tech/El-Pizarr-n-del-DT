import { PlayerEntity } from './player.entity';

export interface PlayerFilters {
  name?: string;
  position?: string;
  rarity?: 'gold' | 'silver' | 'bronze';
  minRating?: number | string;
  maxRating?: number | string;
}

export interface PlayerCatalogRepository {
  findCatalog(filters?: PlayerFilters): Promise<PlayerEntity[]>;
  countByPosition(): Promise<Array<{ position: string; count: number }>>;
}

export const PLAYER_CATALOG_REPOSITORY = Symbol('PLAYER_CATALOG_REPOSITORY');
