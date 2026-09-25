import { DataSource, EntityManager, Repository } from 'typeorm';
import { PlayerEntity } from '../player/player.entity';
import { TeamEntity } from '../team/team.entity';
import { B2bBookingEntity } from '../b2b/entities/booking.entity';
import { PersistenceCache } from './persistence-cache.service';
import { TypeOrmUnitOfWork } from './typeorm-unit-of-work';

describe('TypeOrmUnitOfWork', () => {
  function setup() {
    let committed = false;
    const playerRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (entity: any) => entity),
    };
    const teamRepository = { save: jest.fn(async (entity: any) => entity) };
    const manager = {
      getRepository: jest.fn((entity: any) => entity === PlayerEntity ? playerRepository : teamRepository),
    };
    const dataSource = {
      transaction: jest.fn(async (work: (manager: EntityManager) => Promise<unknown>) => {
        committed = false;
        const result = await work(manager as never);
        committed = true;
        return result;
      }),
    } as unknown as DataSource;
    const invalidate = jest.fn(async () => {
      expect(committed).toBe(true);
    });
    const cache: PersistenceCache = {
      isEnabled: jest.fn().mockReturnValue(true),
      ttlMs: jest.fn().mockReturnValue(60_000),
      cacheId: jest.fn().mockReturnValue('cache-id'),
      invalidate,
    };
    return { dataSource, manager, playerRepository, teamRepository, cache, invalidate, getCommitted: () => committed };
  }

  it('commits writes across multiple repositories through the same transaction manager', async () => {
    const context = setup();
    const uow = new TypeOrmUnitOfWork(context.dataSource, 'game', context.cache);

    await uow.execute(async (repositories) => {
      await repositories.get(PlayerEntity).save({ id: 'p1' } as PlayerEntity);
      await repositories.get(TeamEntity).save({ id: 't1' } as TeamEntity);
    });

    expect(context.dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(context.manager.getRepository).toHaveBeenNthCalledWith(1, PlayerEntity);
    expect(context.manager.getRepository).toHaveBeenNthCalledWith(2, TeamEntity);
    expect(context.invalidate).toHaveBeenCalledTimes(1);
    expect(context.invalidate).toHaveBeenCalledWith('game', 'player-catalog');
  });

  it('does not invalidate after a rolled back transaction', async () => {
    const context = setup();
    const uow = new TypeOrmUnitOfWork(context.dataSource, 'game', context.cache);
    (context.dataSource.transaction as jest.Mock).mockImplementationOnce(async (work: (manager: EntityManager) => Promise<unknown>) => {
      await work(context.manager as never);
      throw new Error('transaction rolled back');
    });

    await expect(uow.execute(async (repositories) => {
      await repositories.get(PlayerEntity).save({ id: 'p1' } as PlayerEntity);
    })).rejects.toThrow('transaction rolled back');

    expect(context.invalidate).not.toHaveBeenCalled();
  });

  it('bypasses cached reads in the transaction-scoped repository', async () => {
    const context = setup();
    const uow = new TypeOrmUnitOfWork(context.dataSource, 'game', context.cache);

    await uow.execute(async (repositories) => {
      await repositories.get(PlayerEntity).find({ cache: { group: 'player-catalog' } });
    });

    expect(context.playerRepository.find).toHaveBeenCalledWith(expect.not.objectContaining({ cache: expect.anything() }));
    expect(context.cache.cacheId).not.toHaveBeenCalled();
  });

  it('keeps repositories scoped to the entity metadata of each datasource', async () => {
    const game = setup();
    const b2b = setup();
    const gameManager = {
      getRepository: jest.fn((entity: any) => {
        if (entity === PlayerEntity) return game.playerRepository;
        throw new Error(`Game datasource has no metadata for ${entity.name}`);
      }),
    };
    const b2bManager = {
      getRepository: jest.fn((entity: any) => {
        if (entity === B2bBookingEntity) return b2b.teamRepository;
        throw new Error(`B2B datasource has no metadata for ${entity.name}`);
      }),
    };
    const gameDataSource = { transaction: jest.fn(async (work: any) => work(gameManager)) } as unknown as DataSource;
    const b2bDataSource = { transaction: jest.fn(async (work: any) => work(b2bManager)) } as unknown as DataSource;
    const gameCache = { ...game.cache, invalidate: jest.fn().mockResolvedValue(undefined) };
    const b2bCache = { ...b2b.cache, invalidate: jest.fn().mockResolvedValue(undefined) };
    const gameUow = new TypeOrmUnitOfWork(gameDataSource, 'game', gameCache);
    const b2bUow = new TypeOrmUnitOfWork(b2bDataSource, 'b2b', b2bCache);

    await gameUow.execute(async (repositories) => {
      await repositories.get(PlayerEntity).save({ id: 'game-player' } as PlayerEntity);
      await expect(Promise.resolve().then(() => repositories.get(B2bBookingEntity))).rejects.toThrow('Game datasource has no metadata');
    });
    await b2bUow.execute(async (repositories) => {
      await repositories.get(B2bBookingEntity).save({ id: 'b2b-booking' } as B2bBookingEntity);
      await expect(Promise.resolve().then(() => repositories.get(PlayerEntity))).rejects.toThrow('B2B datasource has no metadata');
    });

    expect(gameManager.getRepository).toHaveBeenCalledWith(PlayerEntity);
    expect(gameManager.getRepository).toHaveBeenCalledWith(B2bBookingEntity);
    expect(b2bManager.getRepository).toHaveBeenCalledWith(B2bBookingEntity);
    expect(b2bManager.getRepository).toHaveBeenCalledWith(PlayerEntity);
    expect(gameCache.invalidate).toHaveBeenCalledWith('game', 'player-catalog');
    expect(b2bCache.invalidate).not.toHaveBeenCalled();
  });
});
