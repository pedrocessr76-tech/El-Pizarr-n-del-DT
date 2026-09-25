import { Repository } from 'typeorm';
import { PlayerEntity } from '../player/player.entity';
import { PlayerCatalogRepository, PlayerFilters } from '../player/player.repository';
import { PersistenceCache } from './persistence-cache.service';

/** TypeORM adapter for catalog-specific player queries. */
export class TypeOrmPlayerCatalogRepository implements PlayerCatalogRepository {
  constructor(
    private readonly repository: Repository<PlayerEntity>,
    private readonly persistenceCache: PersistenceCache,
  ) {}

  async findCatalog(filters: PlayerFilters = {}): Promise<PlayerEntity[]> {
    const name = filters.name?.trim() || undefined;
    const minRatingValue = filters.minRating == null ? NaN : Number(filters.minRating);
    const maxRatingValue = filters.maxRating == null ? NaN : Number(filters.maxRating);
    const minRating = Number.isFinite(minRatingValue) ? minRatingValue : undefined;
    const maxRating = Number.isFinite(maxRatingValue) ? maxRatingValue : undefined;
    const query = this.repository.createQueryBuilder('player');
    if (name) query.andWhere('player.name ILIKE :name', { name: `%${name}%` });
    if (filters.position) query.andWhere('player.position = :position', { position: filters.position });
    if (filters.rarity === 'gold') query.andWhere('player.rating >= 85');
    if (filters.rarity === 'silver') query.andWhere('player.rating >= 75 AND player.rating < 85');
    if (filters.rarity === 'bronze') query.andWhere('player.rating < 75');
    if (minRating !== undefined) query.andWhere('player.rating >= :minRating', { minRating });
    if (maxRating !== undefined) query.andWhere('player.rating <= :maxRating', { maxRating });
    query.orderBy('player.rating', 'DESC');

    if (this.persistenceCache.isEnabled('game')) {
      const id = this.persistenceCache.cacheId('game', 'player-catalog', {
        name: name?.toLocaleLowerCase('en-US') ?? null,
        position: filters.position ?? null,
        rarity: filters.rarity ?? null,
        minRating: minRating ?? null,
        maxRating: maxRating ?? null,
        order: ['rating', 'DESC'],
      });
      query.cache(id, this.persistenceCache.ttlMs('game'));
    }
    return query.getMany();
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
