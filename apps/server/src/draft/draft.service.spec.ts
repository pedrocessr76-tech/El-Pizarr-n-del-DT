import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { PlayerEntity } from '../player/player.entity';
import { TeamPlayerEntity } from '../team/team-player.entity';
import { TeamEntity } from '../team/team.entity';
import { DraftService } from './draft.service';

function makePlayerEntity(overrides: Partial<PlayerEntity> & { id: string }): PlayerEntity {
  return {
    name: overrides.name ?? 'Jugador ' + overrides.id,
    nationality: overrides.nationality ?? 'ARG',
    position: overrides.position ?? 'MID',
    rating: overrides.rating ?? 80,
    pace: overrides.pace ?? 70,
    shooting: overrides.shooting ?? 70,
    passing: overrides.passing ?? 70,
    dribbling: overrides.dribbling ?? 70,
    defending: overrides.defending ?? 70,
    physical: overrides.physical ?? 70,
    ...overrides,
  } as PlayerEntity;
}

/**
 * Repositorios en memoria: los tests de draft validan reglas de negocio
 * (franjas del sobre, tope de plantilla, reutilización de equipos) sin PostgreSQL.
 */
function makeRepos(players: PlayerEntity[] = []) {
  const teams: TeamEntity[] = [];
  const teamPlayers: TeamPlayerEntity[] = [];
  let teamSequence = 0;

  const playerRepo = {
    count: jest.fn(async () => players.length),
    find: jest.fn(async () => players),
    findOne: jest.fn(async (options: { where: { id: string } }) => players.find((p) => p.id === options.where.id) ?? null),
    createQueryBuilder: jest.fn(() => {
      const state: { position?: string } = {};
      type QueryBuilderStub = {
        where: (clause: string, params: { position: string }) => QueryBuilderStub;
        getMany: () => Promise<PlayerEntity[]>;
      };
      const builder: QueryBuilderStub = {
        where: jest.fn((_clause: string, params: { position: string }) => {
          state.position = params.position;
          return builder;
        }),
        getMany: jest.fn(async () => players.filter((p) => p.position.toUpperCase() === state.position)),
      };
      return builder;
    }),
  };

  const teamRepo = {
    findOne: jest.fn(async (options: { where: { id?: string; sessionId?: string | null; userId?: string } }) => {
      const { id, sessionId, userId } = options.where;
      // `getTeamById` busca por id; las sesiones de invitado por sessionId y
      // el equipo de usuario por userId (el más reciente primero).
      if (id !== undefined) return teams.find((t) => t.id === id) ?? null;
      if (sessionId !== undefined) return teams.find((t) => t.sessionId === sessionId) ?? null;
      if (userId !== undefined) return [...teams].reverse().find((t) => t.userId === userId) ?? null;
      return null;
    }),
    find: jest.fn(async (options: { where: { sessionId?: string | null } }) => {
      return teams.filter((t) => t.sessionId === options.where.sessionId);
    }),
    save: jest.fn(async (team: TeamEntity) => {
      // Upsert por id: guardar dos veces el mismo equipo no debe duplicarlo.
      if (!team.id) {
        teamSequence += 1;
        team.id = 'team-' + teamSequence;
        teams.push(team);
      } else {
        const index = teams.findIndex((t) => t.id === team.id);
        if (index >= 0) teams[index] = team;
        else teams.push(team);
      }
      return team;
    }),
    delete: jest.fn(async (ids: string | string[]) => {
      const list = Array.isArray(ids) ? ids : [ids];
      for (let i = teams.length - 1; i >= 0; i -= 1) {
        const id = teams[i].id;
        if (id !== undefined && list.includes(id)) teams.splice(i, 1);
      }
      return { affected: 0 };
    }),
  };

  const teamPlayerRepo = {
    findOne: jest.fn(async (options: { where: { teamId: string; playerId: string } }) => {
      const { teamId, playerId } = options.where;
      return teamPlayers.find((tp) => tp.teamId === teamId && tp.playerId === playerId) ?? null;
    }),
    count: jest.fn(async (options: { where: { teamId: string; isStarter: boolean } }) => {
      const { teamId, isStarter } = options.where;
      return teamPlayers.filter((tp) => tp.teamId === teamId && tp.isStarter === isStarter).length;
    }),
    save: jest.fn(async (tp: TeamPlayerEntity) => {
      teamPlayers.push(tp);
      return tp;
    }),
    remove: jest.fn(async (tp: TeamPlayerEntity) => {
      const index = teamPlayers.indexOf(tp);
      if (index >= 0) teamPlayers.splice(index, 1);
      return tp;
    }),
    delete: jest.fn(async (criteria: { teamId: string }) => {
      for (let i = teamPlayers.length - 1; i >= 0; i -= 1) {
        if (teamPlayers[i].teamId === criteria.teamId) teamPlayers.splice(i, 1);
      }
      return { affected: 0 };
    }),
  };

  const matchRepo = { delete: jest.fn(async () => ({ affected: 0 })) };
  const tournamentRepo = {
    find: jest.fn(async () => []),
    delete: jest.fn(async () => ({ affected: 0 })),
  };

  const service = new DraftService(
    playerRepo as unknown as Repository<PlayerEntity>,
    teamRepo as unknown as Repository<TeamEntity>,
    teamPlayerRepo as unknown as Repository<TeamPlayerEntity>,
    matchRepo as unknown as Repository<never>,
    tournamentRepo as unknown as Repository<never>,
  );

  return { service, playerRepo, teamRepo, teamPlayerRepo, teams, teamPlayers, players };
}

describe('DraftService - addPlayerToTeam (tope de plantilla)', () => {
  function seedRoster(teamPlayers: TeamPlayerEntity[], teamId: string, starters: number, substitutes: number) {
    for (let index = 0; index < starters; index += 1) {
      teamPlayers.push({ teamId, playerId: 'starter-' + index, isStarter: true } as TeamPlayerEntity);
    }
    for (let index = 0; index < substitutes; index += 1) {
      teamPlayers.push({ teamId, playerId: 'sub-' + index, isStarter: false } as TeamPlayerEntity);
    }
  }

  function seedTeam(repos: ReturnType<typeof makeRepos>, teamId: string, userId = 'user-1') {
    repos.teams.push({ id: teamId, name: 'Mi Equipo', isReal: false, userId } as TeamEntity);
  }

  it('rechaza un equipo inexistente', async () => {
    const repos = makeRepos([makePlayerEntity({ id: 'p1' })]);

    await expect(repos.service.addPlayerToTeam('no-existe', 'p1', true, 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza operar sobre el equipo de OTRO usuario (IDOR → 404 genérico)', async () => {
    const repos = makeRepos([makePlayerEntity({ id: 'p1' })]);
    seedTeam(repos, 'team-1', 'user-otro');

    await expect(repos.service.addPlayerToTeam('team-1', 'p1', true, 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza un jugador inexistente', async () => {
    const repos = makeRepos([]);
    seedTeam(repos, 'team-1');

    await expect(repos.service.addPlayerToTeam('team-1', 'no-existe', true, 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza un jugador que ya está en el equipo', async () => {
    const repos = makeRepos([makePlayerEntity({ id: 'p1' })]);
    seedTeam(repos, 'team-1');
    repos.teamPlayers.push({ teamId: 'team-1', playerId: 'p1', isStarter: true } as TeamPlayerEntity);

    await expect(repos.service.addPlayerToTeam('team-1', 'p1', true, 'user-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza superar los 18 jugadores de la plantilla', async () => {
    const repos = makeRepos([makePlayerEntity({ id: 'nuevo' })]);
    seedTeam(repos, 'team-1');
    seedRoster(repos.teamPlayers, 'team-1', 11, 7);

    await expect(repos.service.addPlayerToTeam('team-1', 'nuevo', true, 'user-1')).rejects.toThrow(/18 jugadores/);
  });

  it('rechaza un doceavo titular', async () => {
    const repos = makeRepos([makePlayerEntity({ id: 'nuevo' })]);
    seedTeam(repos, 'team-1');
    seedRoster(repos.teamPlayers, 'team-1', 11, 0);

    await expect(repos.service.addPlayerToTeam('team-1', 'nuevo', true, 'user-1')).rejects.toThrow(/11 jugadores titulares/);
  });

  it('rechaza un octavo suplente', async () => {
    const repos = makeRepos([makePlayerEntity({ id: 'nuevo' })]);
    seedTeam(repos, 'team-1');
    seedRoster(repos.teamPlayers, 'team-1', 0, 7);

    await expect(repos.service.addPlayerToTeam('team-1', 'nuevo', false, 'user-1')).rejects.toThrow(/7 jugadores suplentes/);
  });

  it('agrega un titular asignando slotIndex según los titulares existentes', async () => {
    const repos = makeRepos([makePlayerEntity({ id: 'nuevo' })]);
    seedTeam(repos, 'team-1');
    seedRoster(repos.teamPlayers, 'team-1', 3, 0);

    const result = await repos.service.addPlayerToTeam('team-1', 'nuevo', true, 'user-1');

    expect(result.success).toBe(true);
    const added = repos.teamPlayers.find((tp) => tp.playerId === 'nuevo');
    expect(added).toBeDefined();
    expect(added?.isStarter).toBe(true);
    expect(added?.slotIndex).toBe(3);
  });

  it('agrega un suplente cuando no se pide titular', async () => {
    const repos = makeRepos([makePlayerEntity({ id: 'nuevo' })]);
    seedTeam(repos, 'team-1');
    seedRoster(repos.teamPlayers, 'team-1', 11, 2);

    const result = await repos.service.addPlayerToTeam('team-1', 'nuevo', false, 'user-1');

    expect(result.success).toBe(true);
    expect(repos.teamPlayers.find((tp) => tp.playerId === 'nuevo')?.slotIndex).toBe(2);
  });
});

describe('DraftService - getPack (franjas de rating)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('devuelve un sobre vacío si no hay jugadores en el catálogo', async () => {
    const { service } = makeRepos([]);

    await expect(service.getPack()).resolves.toEqual({ players: [] });
  });

  it('devuelve un sobre vacío si la posición pedida no tiene jugadores', async () => {
    const { service } = makeRepos([makePlayerEntity({ id: 'p1', position: 'FWD' })]);

    await expect(service.getPack('GK')).resolves.toEqual({ players: [] });
  });

  it('nunca repite jugadores ni supera los 5 del sobre', async () => {
    const players = Array.from({ length: 20 }, (_value, index) => makePlayerEntity({ id: 'p' + index, rating: 80 }));
    const { service } = makeRepos(players);
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const pack = await service.getPack();

    expect(pack.players).toHaveLength(5);
    expect(new Set(pack.players.map((player) => player.id)).size).toBe(5);
  });

  it('franja baja: sólo jugadores con rating menor a 75', async () => {
    const lowRated = [60, 65, 70, 72, 74].map((rating, index) => makePlayerEntity({ id: 'low' + index, rating }));
    const { service } = makeRepos([...lowRated, makePlayerEntity({ id: 'crack', rating: 90 })]);
    jest.spyOn(Math, 'random').mockReturnValue(0.05);

    const pack = await service.getPack();

    expect(pack.players).toHaveLength(5);
    expect(pack.players.every((player) => (player.rating ?? 0) < 75)).toBe(true);
    expect(pack.players.some((player) => player.id === 'crack')).toBe(false);
  });

  it('franja media: sólo jugadores entre 75 y 85', async () => {
    const midRated = [75, 80, 82, 84, 85].map((rating, index) => makePlayerEntity({ id: 'mid' + index, rating }));
    const { service } = makeRepos([...midRated, makePlayerEntity({ id: 'bajo', rating: 60 }), makePlayerEntity({ id: 'top', rating: 95 })]);
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const pack = await service.getPack();

    expect(pack.players).toHaveLength(5);
    expect(pack.players.every((player) => (player.rating ?? 0) >= 75 && (player.rating ?? 0) <= 85)).toBe(true);
  });

  it('franja buena: sólo jugadores con rating de 88 para arriba', async () => {
    const elite = [88, 90, 92, 94, 95].map((rating, index) => makePlayerEntity({ id: 'top' + index, rating }));
    const { service } = makeRepos([...elite, makePlayerEntity({ id: 'medio', rating: 80 })]);
    jest.spyOn(Math, 'random').mockReturnValue(0.9);

    const pack = await service.getPack();

    expect(pack.players).toHaveLength(5);
    expect(pack.players.every((player) => (player.rating ?? 0) >= 88)).toBe(true);
  });

  it('respeta el filtro de posición exacta (queryBuilder, no find completo)', async () => {
    const defenders = [80, 81, 82, 83, 84].map((rating, index) => makePlayerEntity({ id: 'def' + index, position: 'DEF', rating }));
    const forwards = [80, 81, 82].map((rating, index) => makePlayerEntity({ id: 'fwd' + index, position: 'FWD', rating }));
    const { service, playerRepo } = makeRepos([...defenders, ...forwards]);
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const pack = await service.getPack('def');

    expect(playerRepo.createQueryBuilder).toHaveBeenCalled();
    expect(playerRepo.find).not.toHaveBeenCalled();
    expect(pack.players).toHaveLength(5);
    expect(pack.players.every((player) => player.position === 'DEF')).toBe(true);
  });

  it('completa el sobre con el resto del pool si la franja no alcanza 5 jugadores', async () => {
    const lowRated = [60, 65].map((rating, index) => makePlayerEntity({ id: 'low' + index, rating }));
    const elite = [90, 92, 94].map((rating, index) => makePlayerEntity({ id: 'top' + index, rating }));
    const { service } = makeRepos([...lowRated, ...elite]);
    jest.spyOn(Math, 'random').mockReturnValue(0.05);

    const pack = await service.getPack();

    expect(pack.players).toHaveLength(5);
    expect(new Set(pack.players.map((player) => player.id)).size).toBe(5);
  });
});
describe('DraftService - createTeam (identidad del token)', () => {
  it('crea un equipo nuevo para el userId del token', async () => {
    const repos = makeRepos();

    const result = await repos.service.createTeam('user-1');

    expect(result.teamId).toBeTruthy();
    const created = repos.teams.find((team) => team.id === result.teamId);
    expect(created?.userId).toBe('user-1');
    expect(created?.isReal).toBe(false);
  });

  it('reutiliza el último equipo del mismo userId en lugar de crear otro', async () => {
    const repos = makeRepos();

    const first = await repos.service.createTeam('user-1');
    const second = await repos.service.createTeam('user-1');

    expect(second.teamId).toBe(first.teamId);
    expect(repos.teams).toHaveLength(1);
  });

  it('no reutiliza equipos de otros usuarios (aislamiento por identidad)', async () => {
    const repos = makeRepos();
    repos.teams.push({ id: 'team-otro', name: 'Mi Equipo', isReal: false, userId: 'user-2' } as TeamEntity);

    const result = await repos.service.createTeam('user-1');

    expect(result.teamId).not.toBe('team-otro');
    expect(repos.teams.find((team) => team.id === result.teamId)?.userId).toBe('user-1');
  });

  it('el equipo del usuario nunca se marca como rival IA real', async () => {
    const repos = makeRepos();

    const result = await repos.service.createTeam('user-1');

    expect(repos.teams.find((team) => team.id === result.teamId)?.isReal).toBe(false);
  });
});

describe('DraftService - removePlayerFromTeam y resetTeam (ownership)', () => {
  it('quita un jugador del equipo propio', async () => {
    const repos = makeRepos();
    repos.teams.push({ id: 'team-1', name: 'Mi Equipo', isReal: false, userId: 'user-1' } as TeamEntity);
    repos.teamPlayers.push({ teamId: 'team-1', playerId: 'p1', isStarter: true } as TeamPlayerEntity);

    const result = await repos.service.removePlayerFromTeam('team-1', 'p1', 'user-1');

    expect(result.success).toBe(true);
    expect(repos.teamPlayers).toHaveLength(0);
  });

  it('rechaza quitar jugadores de un equipo ajeno (IDOR → 404 genérico)', async () => {
    const repos = makeRepos();
    repos.teams.push({ id: 'team-1', name: 'Mi Equipo', isReal: false, userId: 'user-otro' } as TeamEntity);
    repos.teamPlayers.push({ teamId: 'team-1', playerId: 'p1', isStarter: true } as TeamPlayerEntity);

    await expect(repos.service.removePlayerFromTeam('team-1', 'p1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza quitar un jugador que no está en el equipo', async () => {
    const repos = makeRepos();
    repos.teams.push({ id: 'team-1', name: 'Mi Equipo', isReal: false, userId: 'user-1' } as TeamEntity);

    await expect(repos.service.removePlayerFromTeam('team-1', 'p1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resetea el equipo propio vaciando titulares y suplentes', async () => {
    const repos = makeRepos();
    repos.teams.push({ id: 'team-1', name: 'Mi Equipo', isReal: false, userId: 'user-1' } as TeamEntity);
    repos.teamPlayers.push({ teamId: 'team-1', playerId: 'p1', isStarter: true } as TeamPlayerEntity);
    repos.teamPlayers.push({ teamId: 'team-1', playerId: 'p2', isStarter: false } as TeamPlayerEntity);

    const result = await repos.service.resetTeam('team-1', 'user-1');

    expect(result.success).toBe(true);
    expect(repos.teamPlayers).toHaveLength(0);
  });

  it('rechaza resetear un equipo ajeno (IDOR → 404 genérico)', async () => {
    const repos = makeRepos();
    repos.teams.push({ id: 'team-1', name: 'Mi Equipo', isReal: false, userId: 'user-otro' } as TeamEntity);

    await expect(repos.service.resetTeam('team-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza resetear un equipo inexistente', async () => {
    const repos = makeRepos();

    await expect(repos.service.resetTeam('no-existe', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
