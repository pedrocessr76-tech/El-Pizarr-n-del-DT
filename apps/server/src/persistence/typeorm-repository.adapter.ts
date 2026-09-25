import {
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  In,
  Between,
  DeepPartial,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { getBetweenValues, getInValues, isBetweenValues, isInValues, RepositoryCriteria, RepositoryFindOptions, RepositoryPort } from './repository.port';
import { CacheArea } from './result-cache.config';
import { PersistenceCache } from './persistence-cache.service';

/** The only CRUD adapter that translates application options into TypeORM. */
export class TypeOrmRepositoryAdapter<T extends ObjectLiteral> implements RepositoryPort<T> {
  constructor(
    private readonly repository: Repository<T>,
    private readonly cacheArea: CacheArea = 'game',
    private readonly persistenceCache?: PersistenceCache,
    private readonly writeCacheGroup?: string,
    private readonly onWrite?: (group: string) => Promise<void> | void,
    private readonly allowQueryCache = true,
  ) {}

  find(options: RepositoryFindOptions<T> = {}): Promise<T[]> {
    return this.repository.find(this.toTypeOrmFindOptions(options) as FindManyOptions<T>);
  }

  findOne(options: RepositoryFindOptions<T>): Promise<T | null> {
    return this.repository.findOne(this.toTypeOrmFindOptions(options) as FindOneOptions<T>);
  }

  findOneBy(where: RepositoryCriteria<T>): Promise<T | null> {
    return this.repository.findOneBy(this.translateWhere(where) as FindOptionsWhere<T>);
  }

  findOneByOrFail(where: RepositoryCriteria<T>): Promise<T> {
    return this.repository.findOneByOrFail(this.translateWhere(where) as FindOptionsWhere<T>);
  }

  count(options: RepositoryFindOptions<T> = {}): Promise<number> {
    return this.repository.count(this.toTypeOrmFindOptions(options) as FindManyOptions<T>);
  }

  create(input: Partial<T>): T;
  create(input: Array<Partial<T>>): T[];
  create(input: Partial<T> | Array<Partial<T>>): T | T[] {
    return Array.isArray(input)
      ? this.repository.create(input as unknown as DeepPartial<T>[])
      : this.repository.create(input as DeepPartial<T>);
  }

  save(entity: T): Promise<T>;
  save(entity: T[]): Promise<T[]>;
  async save(entity: T | T[]): Promise<T | T[]> {
    const saved = Array.isArray(entity) ? await this.repository.save(entity) : await this.repository.save(entity);
    await this.afterWrite();
    return saved;
  }

  async delete(criteria: RepositoryCriteria<T> | string | string[]): Promise<{ affected?: number | null }> {
    const where = typeof criteria === 'string' || Array.isArray(criteria)
      ? criteria
      : this.translateWhere(criteria) as FindOptionsWhere<T>;
    const result = await this.repository.delete(where as string | string[] | FindOptionsWhere<T>);
    await this.afterWrite();
    return result;
  }

  async remove(entity: T): Promise<T> {
    const result = await this.repository.remove(entity);
    await this.afterWrite();
    return result;
  }

  async update(criteria: RepositoryCriteria<T> | string, changes: Partial<T>): Promise<{ affected?: number | null }> {
    const where = typeof criteria === 'string' ? criteria : this.translateWhere(criteria) as FindOptionsWhere<T>;
    const result = await this.repository.update(where as string | FindOptionsWhere<T>, changes as never);
    await this.afterWrite();
    return result;
  }

  async upsert(entity: Partial<T> | Array<Partial<T>>, conflictPaths: Array<keyof T>): Promise<unknown> {
    const result = await this.repository.upsert(entity as never, conflictPaths as string[]);
    await this.afterWrite();
    return result;
  }

  private toTypeOrmFindOptions(options: RepositoryFindOptions<T>): Record<string, unknown> {
    const { cache, ...findOptions } = options;
    const result: Record<string, unknown> = { ...findOptions, where: this.translateWhere(options.where) };
    if (cache && !options.lock && this.allowQueryCache && this.persistenceCache?.isEnabled(this.cacheArea)) {
      result.cache = {
        id: this.persistenceCache.cacheId(this.cacheArea, cache.group, findOptions),
        milliseconds: cache.ttlMs ?? this.persistenceCache.ttlMs(this.cacheArea),
      };
    }
    return result;
  }

  private async afterWrite(): Promise<void> {
    if (!this.writeCacheGroup) return;
    if (this.onWrite) await this.onWrite(this.writeCacheGroup);
    else await this.persistenceCache?.invalidate(this.cacheArea, this.writeCacheGroup);
  }

  private translateWhere(where: RepositoryFindOptions<T>['where'] | RepositoryCriteria<T>): unknown {
    if (!where) return where;
    const translate = (entry: RepositoryCriteria<T>) => Object.fromEntries(
      Object.entries(entry).map(([key, value]) => [
        key,
        isInValues(value) ? In(getInValues(value)) : isBetweenValues(value) ? Between(...getBetweenValues(value)) : value,
      ]),
    );
    return Array.isArray(where) ? where.map(translate) : translate(where);
  }
}
