import { Repository } from 'typeorm';
import { PlayerEntity } from '../player/player.entity';
import { PlayerCatalogRepository, PlayerFilters, PaginatedPlayers } from '../player/player.repository';
import { PersistenceCache } from './persistence-cache.service';

const DEFAULT_LIMIT = 48;
const MAX_LIMIT = 100;

/** TypeORM adapter for catalog-specific player queries. */
export class TypeOrmPlayerCatalogRepository implements PlayerCatalogRepository {
  constructor(
    private readonly repository: Repository<PlayerEntity>,
    private readonly persistenceCache: PersistenceCache,
  ) {}

  async findCatalog(filters: PlayerFilters = {}): Promise<PaginatedPlayers> {
    const name = filters.name?.trim() || undefined;
    const minRatingValue = filters.minRating == null ? NaN : Number(filters.minRating);
    const maxRatingValue = filters.maxRating == null ? NaN : Number(filters.maxRating);
    const minRating = Number.isFinite(minRatingValue) ? minRatingValue : undefined;
    const maxRating = Number.isFinite(maxRatingValue) ? maxRatingValue : undefined;

    // Pagination
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || DEFAULT_LIMIT));
    const offset = (page - 1) * limit;

    const query = this.repository.createQueryBuilder('player');
    if (name) query.andWhere('player.name ILIKE :name', { name: `%${name}%` });
    if (filters.position) query.andWhere('player.position = :position', { position: filters.position });
    if (filters.rarity === 'gold') query.andWhere('player.rating >= 85');
    if (filters.rarity === 'silver') query.andWhere('player.rating >= 75 AND player.rating < 85');
    if (filters.rarity === 'bronze') query.andWhere('player.rating < 75');
    if (minRating !== undefined) query.andWhere('player.rating >= :minRating', { minRating });
    if (maxRating !== undefined) query.andWhere('player.rating <= :maxRating', { maxRating });
    query.orderBy('player.rating', 'DESC');
    query.offset(offset).limit(limit);

    if (this.persistenceCache.isEnabled('game')) {
      const id = this.persistenceCache.cacheId('game', 'player-catalog', {
        name: name?.toLocaleLowerCase('en-US') ?? null,
        position: filters.position ?? null,
        rarity: filters.rarity ?? null,
        minRating: minRating ?? null,
        maxRating: maxRating ?? null,
        page,
        limit,
        order: ['rating', 'DESC'],
      });
      query.cache(id, this.persistenceCache.ttlMs('game'));
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit, hasMore: offset + data.length < total };
  }

  async countByPosition(): Promise<Array<{ position: string; count: number }>> {
    const query = this.repository
      .createQueryBuilder('player')
      .select('player.position', 'position')
      .addSelect('COUNT(*)', 'count')
      .groupBy('player.position')
      .orderBy('player.position');
    if (this.persistenceCache.isEnabled('game')) {
      query.cache(this.persistenceCache.cacheId('game', 'player-catalog', { query: 'count-by-position' }), this.persistenceCache.ttlMs('game'));
    }
    const rows = await query.getRawMany<{ position: string; count: string }>();
    return rows.map((row) => ({ position: row.position, count: Number(row.count) }));
  }
}

