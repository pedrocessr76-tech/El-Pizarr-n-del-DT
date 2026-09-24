import { beforeEach, describe, expect, it, vi } from 'vitest';
import { draftService } from './draftService';

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./api', () => ({ api: apiMock }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('draftService', () => {
  it('getPack consulta /draft/pack con el filtro de posición', async () => {
    apiMock.get.mockResolvedValue({ data: { players: [] } });

    await draftService.getPack('DC');

    expect(apiMock.get).toHaveBeenCalledWith('/draft/pack', { params: { position: 'DC' } });
  });

  it('createTeam crea el equipo', async () => {
    apiMock.post.mockResolvedValue({ data: { teamId: 'team-1' } });

    const result = await draftService.createTeam();

    expect(apiMock.post).toHaveBeenCalledWith('/draft/team');
    expect(result.teamId).toBe('team-1');
  });

  it('selectPlayer valida al jugador elegido en el servidor', async () => {
    apiMock.post.mockResolvedValue({ data: { success: true, player: null, message: 'ok' } });

    await draftService.selectPlayer('p-1');

    expect(apiMock.post).toHaveBeenCalledWith('/draft/select', { playerId: 'p-1' });
  });

  it('addPlayerToTeam agrega un titular o suplente', async () => {
    apiMock.post.mockResolvedValue({ data: { success: true, message: 'ok' } });

    await draftService.addPlayerToTeam('team-1', 'p-1', false);

    expect(apiMock.post).toHaveBeenCalledWith('/draft/team/player', { teamId: 'team-1', playerId: 'p-1', isStarter: false });
  });

  it('removePlayerFromTeam usa DELETE con la URL correcta', async () => {
    apiMock.delete.mockResolvedValue({ data: { success: true, message: 'ok' } });

    await draftService.removePlayerFromTeam('team-1', 'p-1');

    expect(apiMock.delete).toHaveBeenCalledWith('/draft/team/team-1/player/p-1');
  });

  it('resetTeam reinicia la plantilla en el servidor', async () => {
    apiMock.post.mockResolvedValue({ data: { success: true, message: 'ok' } });

    await draftService.resetTeam('team-1');

    expect(apiMock.post).toHaveBeenCalledWith('/draft/team/team-1/reset');
  });

  it('propaga errores de red del backend', async () => {
    apiMock.get.mockRejectedValue(new Error('net'));

    await expect(draftService.getPack('DC')).rejects.toThrow('net');
  });
});