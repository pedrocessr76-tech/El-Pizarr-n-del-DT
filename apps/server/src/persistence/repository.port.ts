/** ORM-independent query options shared by the application's repositories. */
export type SortDirection = 'ASC' | 'DESC';
const BETWEEN_VALUES = Symbol('repository.between-values');
export type BetweenValues<T> = { [BETWEEN_VALUES]: [T, T] };
export const betweenValues = <T>(from: T, to: T): BetweenValues<T> => ({ [BETWEEN_VALUES]: [from, to] });
export const isBetweenValues = (value: unknown): value is BetweenValues<unknown> =>
  typeof value === 'object' && value !== null && BETWEEN_VALUES in value;
export const getBetweenValues = (value: BetweenValues<unknown>): [unknown, unknown] => value[BETWEEN_VALUES];
export type RepositoryCriteria<T> = { [K in keyof T]?: T[K] | InValues<unknown> | BetweenValues<T[K]> };

export interface RepositoryFindOptions<T> {
  where?: RepositoryCriteria<T> | Array<RepositoryCriteria<T>>;
  order?: Partial<Record<keyof T, SortDirection>>;
  select?: Partial<Record<keyof T, boolean>>;
  take?: number;
  skip?: number;
  lock?: { mode: 'pessimistic_write' };
  /** Explicitly opt a read into shared result caching. */
  cache?: { group: string; ttlMs?: number };
}

const IN_VALUES = Symbol('repository.in-values');
export type InValues<T> = { [IN_VALUES]: T[] };
export const inValues = <T>(values: T[]): InValues<T> => ({ [IN_VALUES]: values });
export const isInValues = (value: unknown): value is InValues<unknown> =>
  typeof value === 'object' && value !== null && IN_VALUES in value;
export const getInValues = (value: InValues<unknown>): unknown[] => value[IN_VALUES];

/**
 * Application-facing persistence contract. Feature repositories can extend
 * this with domain-specific queries; TypeORM types stay in infrastructure.
 */
export interface RepositoryPort<T extends object> {
  find(options?: RepositoryFindOptions<T>): Promise<T[]>;
  findOne(options: RepositoryFindOptions<T>): Promise<T | null>;
  findOneBy(where: RepositoryCriteria<T>): Promise<T | null>;
  findOneByOrFail(where: RepositoryCriteria<T>): Promise<T>;
  count(options?: RepositoryFindOptions<T>): Promise<number>;
  create(input: Partial<T>): T;
  create(input: Array<Partial<T>>): T[];
  save(entity: T): Promise<T>;
  save(entity: T[]): Promise<T[]>;
  delete(criteria: RepositoryCriteria<T> | string | string[]): Promise<{ affected?: number | null }>;
  remove(entity: T): Promise<T>;
  update(criteria: RepositoryCriteria<T> | string, changes: Partial<T>): Promise<{ affected?: number | null }>;
  upsert(entity: Partial<T> | Array<Partial<T>>, conflictPaths: Array<keyof T>): Promise<unknown>;
}

export interface RepositorySession {
  get<T extends object>(entity: new (...args: any[]) => T): RepositoryPort<T>;
}

export interface UnitOfWork {
  execute<T>(work: (repositories: RepositorySession) => Promise<T>): Promise<T>;
}

export const getRepositoryPortToken = (entity: Function, connection = 'default'): string =>
  `RepositoryPort<${connection}:${entity.name}>`;
