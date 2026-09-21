import { UnauthorizedException } from '@nestjs/common';
import { B2bNotificationsGateway, b2bOrgChannel, b2bUserChannel } from './b2b-notifications.gateway';
import { B2bRoleCode } from '../entities/b2b.enums';

// Aislamiento del canal WS B2B (ALTO 5): los clientes NUNCA se suscriben al
// canal de la organización; solo el staff. Además el handshake revalida la
// identidad contra la BD (ALTO 7) y corta sesiones revocadas.
describe('B2bNotificationsGateway', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const authService = {
    resolveUserFromToken: jest.fn(),
  };
  const gateway = new B2bNotificationsGateway(jwtService as never, authService as never);

  function makeClient() {
    const joined: string[] = [];
    const client = {
      id: 'socket-1',
      handshake: { auth: { token: 'tok' } },
      join: jest.fn(async (channel: string) => {
        joined.push(channel);
      }),
      disconnect: jest.fn(),
    };
    return { client, joined };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('un staff (OWNER) se suscribe al canal personal Y al de su organización', async () => {
    jwtService.verifyAsync.mockResolvedValue({ userId: 'u1', organizationId: 'org', roles: [B2bRoleCode.OWNER], email: 'a@b.c' });
    authService.resolveUserFromToken.mockResolvedValue({ userId: 'u1', organizationId: 'org', roles: [B2bRoleCode.OWNER], email: 'a@b.c' });
    const { client, joined } = makeClient();

    await gateway.handleConnection(client as never);

    expect(joined).toEqual(expect.arrayContaining([b2bUserChannel('u1'), b2bOrgChannel('org')]));
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('un CLIENTE se suscribe SOLO a su canal personal (nunca al de la org = sin datos de terceros)', async () => {
    jwtService.verifyAsync.mockResolvedValue({ userId: 'u2', organizationId: 'org', roles: [B2bRoleCode.CLIENT], email: 'c@d.e' });
    authService.resolveUserFromToken.mockResolvedValue({ userId: 'u2', organizationId: 'org', roles: [B2bRoleCode.CLIENT], email: 'c@d.e' });
    const { client, joined } = makeClient();

    await gateway.handleConnection(client as never);

    expect(joined).toContain(b2bUserChannel('u2'));
    expect(joined).not.toContain(b2bOrgChannel('org'));
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('un token con firma inválida se corta sin suscribir', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('bad signature'));
    const { client, joined } = makeClient();

    await gateway.handleConnection(client as never);

    expect(joined).toHaveLength(0);
    expect(client.disconnect).toHaveBeenCalled();
    expect(authService.resolveUserFromToken).not.toHaveBeenCalled();
  });

  it('una sesión revocada en la BD (usuario inactivo o degradado) se corta pese al token válido', async () => {
    jwtService.verifyAsync.mockResolvedValue({ userId: 'u3', organizationId: 'org', roles: [B2bRoleCode.OPERATOR], email: 'o@p.q' });
    authService.resolveUserFromToken.mockRejectedValue(new UnauthorizedException('Sesión B2B inválida'));
    const { client, joined } = makeClient();

    await gateway.handleConnection(client as never);

    expect(joined).toHaveLength(0);
    expect(client.disconnect).toHaveBeenCalled();
  });
});